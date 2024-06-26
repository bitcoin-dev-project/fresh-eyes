import React from "react";
import { PullRequest } from "@/types";

export interface CustomInputProps {
  label: string;
  placeholder: string;
  name: string;
  value: string | number;
  type: React.HTMLInputTypeAttribute | undefined;
  setFormValues: React.Dispatch<React.SetStateAction<PullRequest>>;
}

export const CustomInput = ({ label, placeholder, name, value, type, setFormValues }: CustomInputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const { value, name } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className='flex flex-col gap-2 w-full'>
      <label htmlFor='' className='font-medium uppercase text-[13px] dark:text-[#fffeee]'>
        {label}
      </label>
      <input
        className='border-[1.5px] bg-secondary-gray border-input-border text-base font-medium p-4 px-3 rounded-md w-full placeholder:font-normal placeholder:text-sm placeholder:text-[#343434] placeholder:text-opacity-75 text-black outline-black'
        placeholder={placeholder}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        required
      />
    </div>
  );
};

export const ClickableOptions = ({
  owner,
  repo,
  pull_number,
  setFormValues,
  title,
}: PullRequest & {
  setFormValues: React.Dispatch<React.SetStateAction<PullRequest>>;
  title: string;
}) => {
  return (
    <button
      className={`w-full dark:text-white min-h-full min-w-[170px] p-3 rounded-xl md:hover:scale-105 flex flex-col items-start relative border-b border-gray-200 bg-white dark:bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30`}
      onClick={() => setFormValues((prev) => ({ ...prev, owner, repo, pull_number }))}
    >
      <section className='absolute right-3 bottom-3'>
        <p className='text-xs dark:text-white border-[1.5px] p-2 px-3 rounded-3xl font-bold'>CLONE</p>
      </section>
      <p className='uppercase text-sm font-bold underline text-start pb-2'>{title}</p>
      <p className='font-medium text-start'>
        <span className='text-sm font-light'>owner / organization: </span>
        {owner}
      </p>
      <p className='font-medium'>
        <span className='text-sm font-light'>repo: </span>
        {repo}
      </p>
      <p className='font-medium'>
        <span className='text-sm font-light'>pull number: </span>
        {pull_number}
      </p>
    </button>
  );
};
