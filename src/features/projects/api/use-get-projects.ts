import { useQuery } from "@tanstack/react-query";

import {client} from "@/lib/rpc";

interface UseGetProjectsProps {
    workspaceId : string;
}


export const useGetProjects = ({
    workspaceId
}:UseGetProjectsProps) => {
    const query = useQuery({
        queryKey:["projects", workspaceId],
        queryFn : async () => {
            const res = await client.api.projects.$get({query : {workspaceId}});

            if(!res.ok) { //FOR error handling this is must, no use wrapping api call in try and catch 
                throw new Error("Failed to fetch Projects");
            }

            const {data} = await res.json();

            return data;
        }
    });

    return query;
}