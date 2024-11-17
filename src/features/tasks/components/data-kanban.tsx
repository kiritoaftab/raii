import { Task, TaskStatus } from "../types";
import React, {useCallback, useEffect,useState} from "react";
import {DragDropContext, Droppable, Draggable, DropResult} from "@hello-pangea/dnd";
import { KanbanColumnHeader } from "./kanban-column-header";
import { KabanCard } from "./kaban-card";

interface DataKanbanProps {
    data:Task[];
}

const boards : TaskStatus[] = [
    TaskStatus.BACKLOG,
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE
];

type TaskState = {
    [key in TaskStatus] :Task[];
}

export const DataKanban = ({data}:DataKanbanProps) =>{

    const [tasks,setTasks] = useState<TaskState>(() => {
        const inititalTasks: TaskState = {
            [TaskStatus.BACKLOG] : [],
            [TaskStatus.TODO] : [],
            [TaskStatus.IN_PROGRESS] : [],
            [TaskStatus.IN_REVIEW] : [],
            [TaskStatus.DONE] : [],
        };

        data.forEach((task) => {
            inititalTasks[task.status].push(task)
        });

        Object.keys(inititalTasks).forEach((status) => {
            inititalTasks[status as TaskStatus].sort((a,b) => a.position - b.position);
        });

        return inititalTasks;
    });

    const onDragEnd = useCallback((result:DropResult)=> {
        i
    },[])

    return(
        <DragDropContext onDragEnd={() => {}}>
           <div className="flex overflow-x-auto">
                {boards.map((board) => {
                    return(
                        <div key={board} className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]">
                            <KanbanColumnHeader
                                board={board}
                                taskCount={tasks[board].length}
                            />
                            <Droppable droppableId={board}>
                                {(provided) => (
                                    <div 
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="min-h-[200px] py-1.5"
                                    >   
                                        {tasks[board].map((task,index) => (
                                            <Draggable key={task.$id} draggableId={task.$id} index={index}>
                                                {(provided) => (
                                                    <div 
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        ref={provided.innerRef}
                                                    >   
                                                        <KabanCard
                                                            task={task}
                                                        />
                                                    </div>
                                                )

                                                }
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )
                                }
                            </Droppable>
                        </div>
                    )
                })

                }
           </div>
        </DragDropContext>
    )
}