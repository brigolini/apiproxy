import {ActionArgs, json, LoaderArgs, redirect} from '@remix-run/node';
import {Form, useLoaderData} from '@remix-run/react';

export const loader = async ({
                               params,
                               request,
                             }: LoaderArgs) => {
  const res = await fetch("http://localhost:3003/mode");
  const result = await res.json();
  console.info(result)
  return json(result)
}

export const action = async ({ request }: ActionArgs) => {
  await fetch("http://localhost:3003/mode/toggle", {method: "PUT"});
  return redirect ("/mode");
};


export default function Index () {
  const appMode = useLoaderData();
  return (
    <div className="flex flex-col">
      <h1 className="pt-5 w-screen flex justify-center font-bold text-2xl">Choose Mode</h1>
      <div className="pt-6 w-screen flex justify-center">
        <Form method="post" action="/mode">
            <button type="submit" className="border-violet-950 border py-1.5 px-6">Change to {appMode.mode === "CACHE"?`learning`:`cache`}</button>
        </Form>
      </div>
    </div>
  )

}
