"use client";

import React, { useState } from "react";
import { PullRequest } from "@/proto/fresheyes_pb";

import Modal from "../modal/Modal";
import { useGrpcClient } from "@/app/hooks/useGrpcClinet";

const FormSection = () => {
  const { client } = useGrpcClient();

  const [link, setLink] = useState("");
  const [loading, setLoading] = useState({ loader: false, modal: false });
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState<{ owner: string; repo: string; pull_number: number }>({
    owner: "bitcoin",
    repo: "bitcoin",
    pull_number: 0,
  });

  const { owner, repo, pull_number } = formValues;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const { value, name } = event.target;

    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const processPullRequest = async () => {
    setLink("");
    setFormValues({ owner: "", repo: "", pull_number: 0 });
    setLoading({ loader: false, modal: false });

    if (pull_number === 0) {
      alert("You must pass a number that is not zero");
      return;
    }
    setLoading({ loader: true, modal: false });

    const pr = new PullRequest();
    pr.setOwner(owner.trim());
    pr.setRepo(repo.trim());
    pr.setPullNumber(pull_number);

    const res = client.processPullRequest(pr, (error, result) => {
      if (error) {
        setError(`Error: ${error.message} Please try again or contact support info@bitcoindevs.xyz`);
        console.log({ error });
        setLoading({ loader: false, modal: false });
      } else {
        setLink(result?.getPrUrl()!);
        setLoading({ loader: false, modal: true });
      }
    });

    return res;
  };

  return (
    <>
      <div className='mt-8 flex flex-col gap-5 border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto rounded-xl lg:border lg:bg-gray-200 p-4 md:p-6 lg:dark:bg-zinc-800/30'>
        <h1 className='text-[15px]'>Recreate a pull request with the following details</h1>
        <section className='flex gap-4'>
          <input
            className={`border-[1.5px] bg-secondary-gray border-input-border text-base p-4 rounded-md w-full placeholder:font-medium text-black `}
            placeholder='owner'
            name='owner'
            type='text'
            value={owner}
            onChange={handleChange}
          />
          <input
            className={`border-[1.5px] bg-secondary-gray border-input-border text-base p-4 rounded-md w-full placeholder:font-medium text-black `}
            placeholder='repo'
            name='repo'
            type='text'
            value={repo}
            onChange={handleChange}
          />
        </section>
        <input
          className={`border-[1.5px] bg-secondary-gray border-input-border text-base p-4 rounded-md w-full placeholder:font-medium text-black `}
          placeholder='pull request number'
          name='pull_number'
          type='number'
          value={pull_number}
          onChange={handleChange}
        />
        {error && <p className=' text-center text-red-600 font-semibold'>{error}</p>}
        <button
          className={`bg- border border-white hover:opacity-70 rounded-md w-full px-12 py-[16px] whitespace-nowrap font-semibold `}
          onClick={processPullRequest}
        >
          Create PR
        </button>
      </div>

      {loading.loader || loading.modal ? <Modal link={link} loading={loading} setLoading={setLoading} /> : null}
    </>
  );
};

export default FormSection;
