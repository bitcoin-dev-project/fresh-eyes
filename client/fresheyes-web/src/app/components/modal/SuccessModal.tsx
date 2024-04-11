import React, { useEffect } from "react";
import Image from "next/image";
import checkmarkIcon from "../../assets/checkmark.svg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SuccessModal = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const isInstalled = params.get("installation_id") !== null;
    if (isInstalled) {
      setIsOpen(true);
    }
  }, [pathname]);

  const closeModal = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className='fixed top-0 bottom-0 right-0 left-0 flex items-center justify-center dark:from-inherit bg-zinc-800/30 backdrop-blur-sm z-30 p-3'
          onClick={closeModal}
        >
          <div className='rounded-md min-h-[300px] max-w-[500px] w-full bg-gray-100 dark:bg-black z-50 border-[0.25px] border-white flex items-center justify-center flex-col p-3 md:p-6 gap-6 relative'>
            <section className='relative h-32 w-32'>
              <Image src={checkmarkIcon} alt='checkmark icon' fill className='w-full h-full' />
            </section>
            <section className='text-center'>
              <h1 className='font-bold text-3xl'>Success!</h1>
              <p>FreshEyes bot successfully installed</p>
            </section>
            <button
              className='uppercase border border-gray-400 dark:hover:bg-black dark:border-white hover:bg-gray-300 dark:hover:opacity-70 rounded-md w-full px-12 py-[16px] whitespace-nowrap font-semibold cursor-pointer'
              onClick={closeModal}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};
