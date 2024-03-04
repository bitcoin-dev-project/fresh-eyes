import { auth } from "@/auth";
import Image from "next/image";
import FormSection from "./components/form/FormSection";

export default async function Home() {
  const session = await auth();

  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-3 pt-24 md:p-24'>
      <section className='z-10 max-w-5xl xl:w-2/4 items-center justify-between font-mono text-sm'>
        <h1 className=' text-center font-semibold text-xl pb-8'> FRESH EYES</h1>
        <div className='flex w-full items-center justify-between border-b border-gray-300 bg-gradient-to-b from-zinc-200 py-4 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  rounded-xl lg:border lg:bg-gray-200 p-4 lg:dark:bg-zinc-800/30'>
          <p className='w-full'>Welcome {session?.user.name}!</p>
          <picture className='flex w-full h-full items-end justify-end'>
            <Image src={session?.user.image || "/vercel.svg"} alt='Vercel Logo' className='rounded-full' width={48} height={48} priority />
          </picture>
        </div>
        <FormSection  />
      </section>
    </main>
  );
}
