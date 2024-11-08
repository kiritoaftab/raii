import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";
import { useRouter } from "next/navigation";

type RequestType = InferRequestType<typeof client.api.auth.signup["$post"]>
type ResponseType = InferResponseType<typeof client.api.auth.signup["$post"]>

export const useSignup = () => {

    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation<
    ResponseType,
    Error,
    RequestType
    >({
        mutationFn: async ( {json}) => {
            const response = await client.api.auth.signup["$post"]({json});

            if(!response.ok){
                throw new Error("Failed to Register");
            }
            return response.json();
        }, 
        onSuccess: () => {
            toast.success("Registered");
            router.refresh();
            queryClient.invalidateQueries({queryKey:["current"]})
        },
        onError: () => {
            toast.error("Failed to register");
        }
    })

    return mutation;
}