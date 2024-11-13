import { useQuery } from "@tanstack/react-query";

import {client} from "@/lib/rpc";
import { TaskStatus } from "../types";

interface UseGetTasksProps {
    workspaceId : string;
    projectId? :string | null;
    search? :string | null;
    status? : TaskStatus | null;
    assigneeId? : string | null;
    dueDate?: string | null;
}


export const useGetTasks = ({
    workspaceId,
    projectId,
    status,
    search,
    assigneeId,
    dueDate

}:UseGetTasksProps) => {
    const query = useQuery({
        queryKey:["tasks", workspaceId, projectId, status, search, assigneeId, dueDate],
        queryFn : async () => {
            const res = await client.api.tasks.$get(
                {query : 
                    { workspaceId ,
                      projectId : projectId ?? undefined,
                      status : status ?? undefined,
                      search : search ?? undefined,
                      assigneeId : assigneeId ?? undefined,
                      dueDate : dueDate ?? undefined  
                    }
                });

            if(!res.ok) { //FOR error handling this is must, no use wrapping api call in try and catch 
                throw new Error("Failed to fetch Projects");
            }

            const {data} = await res.json();

            return data;
        }
    });

    return query;
}