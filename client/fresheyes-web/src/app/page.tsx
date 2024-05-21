import { auth } from "@/auth";
import FormSection from "./components/form/FormSection";
import { Menu } from "./components/menu/Menu";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-3 pt-8 md:pt-24 md:px-20'>
      <section className='z-10 w-full flex flex-col items-center justify-between text-sm'>
        <Link href={"/home"} className='text-center font-semibold text-xl pb-8'>
          FRESHEYES
        </Link>

        <div className='flex max-w-5xl xl:w-3/4 w-full items-center justify-between border-b border-gray-300 bg-gradient-to-b from-zinc-200 py-4 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static rounded-xl lg:border lg:bg-gray-200 p-4 lg:dark:bg-zinc-800/30'>
          <p className='w-full text-base'>Welcome {session?.user.name}!</p>
          <Menu image={session?.user.image} />
        </div>
      </section>
      <div className='w-full h-full flex-1'>
        <FormSection username={session?.user.login} />
      </div>
    </main>
  );
}
