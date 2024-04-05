import Link from "next/link";
import React from "react";

const Modal = ({
  href,
  title,
  spanTitle,
  message,
  linkName,
  loading,
  setLoading,
}: {
  href?: string;
  loading: { loader: boolean; modal: boolean, isInstalledModal: boolean };
  setLoading: React.Dispatch<
    React.SetStateAction<{
      loader: boolean;
      modal: boolean;
      isInstalledModal: boolean
    }>
  >;
  title?: string;
  spanTitle?: string;
  message?: React.ReactNode;
  linkName?: string;
}) => {
  return (
    <>
      <div className="fixed top-0 bottom-0 right-0 left-0 flex items-center justify-center dark:from-inherit bg-zinc-800/30 backdrop-blur-sm  opacity- z-30 p-3">
        <div className="rounded-md min-h-[300px] max-w-[500px] w-full bg-black z-50 border-[0.25px] border-white flex items-center justify-center flex-col p-3 md:p-6 gap-6 relative">
          {loading.loader ? (
            <section>
              <div className="loader m-auto border-[4px] md:border-[8px] border-[#EAF0F6] rounded-[50%] border-t-4 md:border-t-8 border-t-[#000000] max-w-[150px] max-h-[150px] w-[50px] md:w-[80px] h-[50px] md:h-[80px] animate-spin"></div>
            </section>
          ) : null}

          {loading.modal || loading.isInstalledModal ? (
            <>
              <div
                className="text-lg absolute top-4 right-4 md:right-4 border p-2 px-4 cursor-pointer"
                onClick={() =>
                  setLoading((prev) => ({
                    ...prev,
                    loader: false,
                    modal: false,
                    isInstalledModal: false
                  }))
                }
              >
                X
              </div>

              <section className=" flex flex-col items-center justify-center gap-6 w-full pt-10">
                <p className=" text-xl md:text-2xl font-semibold">{title} <span className=' underline text-lg'>{spanTitle}</span></p>
                <div className="">{message}</div>
                <Link
                  href={href || "/"}
                  target="_blank"
                  className="font-semibold text-base bg- border border-white hover:opacity-70 rounded-md w-full px-12 py-[14px] whitespace-nowrap flex items-center justify-center"
                >
                  {linkName}
                </Link>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Modal;
