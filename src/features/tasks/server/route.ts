import { sessionMiddleWare } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import {z} from "zod";
import { Hono } from "hono";
import { createTaskSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";
import { ID, Query } from "node-appwrite";
import { Task, TaskStatus } from "../types";
import { createAdminClient } from "@/lib/appwrite";
import { Project } from "@/features/projects/types";

const app = new Hono()
    .delete(
        "/:taskId",
        sessionMiddleWare,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const {taskId} = c.req.param();

            const task = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                taskId
            );

            const member = await getMember({
                databases,
                workspaceId : task.workspaceId,
                userId: user.$id
            })

            if(!member){
                return c.json({
                    error:"Unauthorized"
                },401)
            }

            await databases.deleteDocument(
                DATABASE_ID,
                TASKS_ID,
                taskId
            );

            return c.json( { data:{ $id : task.$id } } )
        } 
    )
    .get("/", 
    sessionMiddleWare,
    zValidator("query",z.object({
        workspaceId : z.string(), 
        projectId: z.string().nullish(),
        assigneeId : z.string().nullish(),
        status : z.nativeEnum(TaskStatus).nullish(),
        search : z.string().nullish(),
        dueDate : z.string().nullish()
    }) ), 
    async (c) => {
        const {users} = await createAdminClient();

        const databases = c.get("databases");
        const user = c.get("user");

        const {
            workspaceId,
            projectId,
            assigneeId,
            status,
            search,
            dueDate
        } = c.req.valid("query");

        const member = await getMember({
            databases,
            workspaceId,
            userId:user.$id
        });

        if(!member) {
            return c.json({error:"Unauthorized"},401)
        }

        const query = [
            Query.equal("workspaceId",workspaceId),
            Query.orderDesc("$createdAt")
        ];

        if(projectId){
            console.log("Project Id :",projectId);
            query.push(Query.equal("projectId",projectId))
        }

        if(assigneeId){
            console.log("Assignee Id :",assigneeId);
            query.push(Query.equal("assigneeId",assigneeId))
        }

        if(status){
            console.log("Status  :",status);
            query.push(Query.equal("status",status))
        }

        if(dueDate){
            console.log("Due Date  :",dueDate);
            query.push(Query.equal("dueDate",dueDate))
        }

        if(search){
            console.log("Search :",search);
            query.push(Query.search("name",search));
        }

        const tasks = await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            query,
        );

        const projectIds = tasks.documents.map((task) => task.projectId);
        const assigneeIds = tasks.documents.map((task) => task.assigneeId);
        const projects = await databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectIds.length > 0 ? [Query.contains("$id",projectIds)] : []
        )

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            assigneeIds.length > 0 ? [Query.contains("$id",assigneeIds)] : []
        );

        const assignees = await Promise.all(
            members.documents.map(async (member) => {
                const user = await users.get(member.userId);

                return {
                    ...member,
                    name : user.name,
                    email : user.email
                }
            })
        )

        const populatedTasks = tasks.documents.map((task) => {
            const project = projects.documents.find((project) => project.$id === task.projectId);
            const assignee = assignees.find((assignee) => assignee.$id === task.assigneeId);

            return {
                ...task,
                project,
                assignee
            }
        });

        return c.json({
            data : {
                ...tasks,
                documents : populatedTasks
            }
        })

    }
    )
    .post("/",
    sessionMiddleWare,
    zValidator("json",createTaskSchema),
    async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const { name, workspaceId, projectId, description, dueDate, status, assigneeId} = c.req.valid("json");

        const member = await getMember({
            databases,
            workspaceId,
            userId:user.$id
        });

        if(!member) {
            return c.json({error:"Unauthorized"},401);
        }

        const highestPositionTask = await databases.listDocuments(
            DATABASE_ID,
            TASKS_ID,
            [
                Query.equal("status", status),
                Query.equal("workspaceId",workspaceId),
                Query.orderAsc("position"),
                Query.limit(1)
            ]
        );


        const newPosition = highestPositionTask.documents.length > 0 ?
            highestPositionTask.documents[0].position + 1000 
            :1000;

        const task = await databases.createDocument(
            DATABASE_ID,
            TASKS_ID,
            ID.unique(),
            {
                name,
                status,
                workspaceId,
                projectId,
                dueDate,
                description,
                assigneeId,
                position : newPosition
            }
        );

        return c.json({data : task});
    })
    .patch("/:taskId",
    sessionMiddleWare,
    zValidator("json",createTaskSchema.partial()),
    async (c) => {
        const databases = c.get("databases");
        const user = c.get("user");

        const {taskId} = c.req.param();
        console.log("Task being edited",taskId);

        const existingTask = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId
        )

        const workspaceId = existingTask.workspaceId;

        const { name, projectId, description, dueDate, status, assigneeId} = c.req.valid("json");

        const member = await getMember({
            databases,
            workspaceId ,
            userId:user.$id
        });

        if(!member) {
            return c.json({error:"Unauthorized"},401);
        }


        const task = await databases.updateDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId,
            {
                name,
                status,
                projectId,
                dueDate,
                description,
                assigneeId,
            }
        );

        return c.json({data : task});
    })
    .get(
        "/:taskId",
        sessionMiddleWare,
        async (c) => {
            const currentUser = c.get("user");
            const databases = c.get("databases");
            const {users} = await createAdminClient();

            const {taskId} = c.req.param();

            const task = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                taskId
            );

            const currentMember = await getMember({
                databases,
                workspaceId :task.workspaceId,
                userId:currentUser.$id
            });

            if(!currentMember){
                return c.json({error:"Unauthorized"},401);
            }

            const project = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                task.projectId
            );

            const member = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                task.assigneeId
            );

            const user = await users.get(member.userId);

            const assignee = {
                ...member,
                email:user.email,
                name:user.name
            };

            return c.json({
                data:{
                    ...task,
                    project,
                    assignee
                }
            })
        }
    )
;


export default app;