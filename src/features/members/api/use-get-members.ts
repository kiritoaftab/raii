import { useQuery } from "@tanstack/react-query";

import {client} from "@/lib/rpc";

interface UseGetMembersProps {
    workspaceId : string;
}


export const useGetMembers = ({
    workspaceId
}:UseGetMembersProps) => {
    const query = useQuery({
        queryKey:["members", workspaceId],
        queryFn : async () => {
            const res = await client.api.members.$get({query : {workspaceId}});

            if(!res.ok) { //FOR error handling this is must, no use wrapping api call in try and catch 
                throw new Error("Failed to fetch Members");
            }

            const {data} = await res.json();

            return data;
        }
    });

    return query;
}