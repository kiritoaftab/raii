import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";

export default async function Home() { // NOTE: async can only be used on server component
 
  const user = await getCurrent();

  if(!user) redirect("/sign-in");

  return (
    <div className="">
       This is home page
    </div>
  );
}
