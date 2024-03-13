"use client";

import React, { useState } from "react";

import Modal from "../modal/Modal";
import { processPr } from "./proceess-pr";
import { PullRequest } from "@/types";
import { checkIfAppInstalledInRepo, forkRepository } from "./bot";
import { INSTALLATION_URL } from "@/config/process";

const FormSection = () => {
  const [link, setLink] = useState("");
  const [isBotInstalled, setIsBotInstalled] = useState(false);
  const [loading, setLoading] = useState({ loader: false, modal: false, isInstalledModal: false });
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState<PullRequest>({
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
    setLoading({ loader: false, modal: false, isInstalledModal: false });

    if (pull_number === 0) {
      alert("You must pass a number that is not zero");
      return;
    }
    setLoading({ loader: true, modal: false, isInstalledModal: false });
    const isBotInstalled = await checkIfAppInstalledInRepo({
      repoName: repo.trim(),
    });

    if (!isBotInstalled.installed) {
      const forkRepo = await forkRepository({ owner, repo });

      setIsBotInstalled(false);
      setLoading({ loader: false, modal: false, isInstalledModal: true });
      return;
    }

    const response = await processPr({
      owner: owner.trim(),
      repo: repo.trim(),
      pull_number,
    });
    if (response.error || !response.data) {
      setError(response.error);
      setLoading({ loader: false, modal: false, isInstalledModal: false });
    } else {
      const data = response.data;
      setLink(data.pr_url!);
      setLoading({ loader: false, modal: true, isInstalledModal: false });
      setFormValues({ owner: "", repo: "", pull_number: 0 });
      setError("");
    }
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
          value={pull_number === 0 ? "" : pull_number}
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

      {loading.loader || loading.modal ? (
        <Modal
          href={link}
          loading={loading}
          setLoading={setLoading}
          title='SUCCESS'
          message='Click the button to view the pull request'
          linkName='View PR'
        />
      ) : null}

      {!isBotInstalled && loading.isInstalledModal ? (
        <Modal
          loading={loading}
          setLoading={setLoading}
          title='FreshEyes Bot not installed in the repository'
          message={
            <section className=''>
              <p>
                Please install the FreshEyes bot in the repository to proceed. The bot is required to recreate the review comments associated with the
                pull request.
              </p>
              <p className=' font-semibold text-base underline pt-4 pb-2'>Steps</p>
              <ol className=' list-decimal list-inside flex flex-col gap-2 py-4 pt-0'>
                <li>Follow the installation link below to start.</li>
                <li>Select where you want to install fresheyes bot.</li>
                <li>
                  Click on the <span className='bg-gray-600 leading-[250%] p-1 font-semibold rounded-sm text-xs'>Select repositories</span> to add the
                  repository you want to install the bot in.
                </li>
                <li>
                  Click on the <span className=' bg-green-500 p-1 leading-[250%] font-semibold rounded-sm text-xs'>Save</span> button to complete the
                  process.
                </li>
                <li>After a successful installation you'll be redirected to start using Fresheyes.</li>
              </ol>
            </section>
          }
          linkName='Install FreshEyes Bot'
          href={`https://github.com/apps/${INSTALLATION_URL}/installations/new`}
        />
      ) : null}
    </>
  );
};

export default FormSection;
