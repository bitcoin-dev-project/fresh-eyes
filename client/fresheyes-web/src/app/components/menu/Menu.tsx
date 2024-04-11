"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { signOut } from "next-auth/react";
import { getInstalledRepositories } from "../form/bot";
import { ExitArrowIcon } from "@/app/assets/icons/exitArrow";

export const Menu = ({ image }: { image: string | StaticImport | null | undefined }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [installedRepos, setInstalledRepos] = useState<any[] | null>([]);

  React.useEffect(() => {
    const getInstalledRepos = async () => {
      setLoading(true);
      setInstalledRepos([]);
      const res = await getInstalledRepositories();
      setInstalledRepos(res.list);
      setLoading(false);
    };

    getInstalledRepos();
  }, []);
  return (
    <div className='relative'>
      <button onClick={() => setOpen(!open)}>
        <picture className='flex  h-full items-end justify-end'>
          <Image src={image!} alt='Profile Picture' className='rounded-full border-[1.5px]' width={48} height={48} priority />
        </picture>
      </button>

      {open && (
        <section className='bg-[#2d2d2d] p-4 py-5 rounded-md whitespace-nowrap flex flex-col gap-4 absolute right-0 top-14 min-w-[270px]'>
          <Link href={"/home"} className='hover:underline hover:font-bold flex items-center gap-2'>
            Home <ExitArrowIcon />
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className='flex hover:underline hover:font-bold items-center gap-2'>
            Sign Out <ExitArrowIcon />
          </button>
          <div>
            <p className='underline font-semibold  pb-1'>Connected Repos</p>
            {loading ? (
              <p>Loading ....</p>
            ) : (
              <>
                {installedRepos && installedRepos?.length > 0 ? (
                  <ol className='list-disc list-inside flex flex-col gap-1'>
                    {installedRepos?.map((item) => (
                      <li key={item.id}>{item.full_name}</li>
                    ))}
                  </ol>
                ) : (
                  <p>FreshEyes bot has not been installed in any of your repositories</p>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
