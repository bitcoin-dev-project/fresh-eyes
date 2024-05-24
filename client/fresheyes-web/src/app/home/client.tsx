"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import LandingImage from "../assets/landing-image.png";

export default function Client() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const res = await signIn("github", { callbackUrl: "/" });
      if (res && !res.error) {
        setLoading(false);
      }
      console.log("signed in", { loading, res });
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <section className="w-full h-screen py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4 gap-y-10">
            <div className="space-y-8">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl leading-10">
                FreshEyes: Review Pull Requests without distractions
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                FreshEyes is the essential tool for reviewing pull requests
                without distractions. Clone the PR to your GitHub account and
                install the FreshEyes bot to focus on the code, and not on the
                comments.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <button
                className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300`}
                onClick={handleClick}
              >
                {loading ? <LoadingEllipsis /> : "Get Started"}
              </button>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:ring-gray-300"
                href="https://github.com/bitcoin-dev-project/fresh-eyes"
                target="_blank"
              >
                GitHub
              </Link>
            </div>
          </div>
          <picture className="flex items-center justify-center h-min">
            <Image
              alt="Image"
              className="mx-auto aspect-video rounded-xl object-center sm:w-full h-full"
              height="400"
              src={LandingImage}
              width="550"
              priority
            />
          </picture>
        </div>
      </div>
    </section>
  );
}

const LoadingEllipsis = () => {
  return (
    <div className="flex space-x-2 animate-bounce">
      <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
      <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
      <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
    </div>
  );
};
