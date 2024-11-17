import { useQuery } from "@tanstack/react-query";

import {client} from "@/lib/rpc";

interface UseGetTaskProps {
    taskId:string
}


export const useGetTask = ({
    taskId
}:UseGetTaskProps) => {
    const query = useQuery({
        queryKey:["task",taskId],
        queryFn : async () => {
            const res = await client.api.tasks[":taskId"].$get({param:{
                taskId
            }});

            if(!res.ok) { //FOR error handling this is must, no use wrapping api call in try and catch 
                throw new Error("Failed to fetch Individual Task");
            }

            const {data} = await res.json();

            return data;
        }
    });

    return query;
}