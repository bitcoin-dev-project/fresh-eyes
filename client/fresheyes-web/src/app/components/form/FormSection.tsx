"use client";

import React, { useState } from "react";

import Modal from "../modal/Modal";
import { processPr } from "./proceess-pr";
import { PullRequest, PullRequestResponse } from "@/types";
import { checkIfAppInstalledInRepo, forkRepository } from "./bot";
import { INSTALLATION_URL } from "@/config/process";
import { ClickableOptions, CustomInput } from "./CustomComponents";
import Link from "next/link";
import { SuccessModal } from "../modal/SuccessModal";

const FormSection = ({ username }: { username: string | null | undefined }) => {
  const [link, setLink] = useState("");
  const [isBotInstalled, setIsBotInstalled] = useState(false);
  const [loading, setLoading] = useState({
    loader: false,
    modal: false,
    isInstalledModal: false,
  });
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState<PullRequest>({
    owner: "bitcoin",
    repo: "bitcoin",
    pull_number: 29242,
    // owner: "",
    // repo: "",
    // pull_number: 0,
  });

  const { owner, repo, pull_number } = formValues;

  const processPullRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLink("");
    setError("");
    setLoading({ loader: false, modal: false, isInstalledModal: false });

    if (pull_number === 0 || (typeof pull_number !== "number" && pull_number === "0")) {
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
    <div className='w-full h-full flex flex-col justify-between items-center gap-10'>
      <div className='w-full  max-w-5xl xl:w-3/4'>
        <form
          className='mt-8 flex flex-col gap-6 border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto rounded-md lg:border lg:bg-gray-200 p-4 md:p-8 lg:dark:bg-zinc-800/30'
          onSubmit={processPullRequest}
        >
          <h1>Please enter the following details to run FreshEyes</h1>
          <section className='flex flex-col md:flex-row gap-4'>
            <CustomInput
              label='Owner / Organization'
              placeholder='e.g. bitcoin'
              name='owner'
              type='text'
              value={owner}
              setFormValues={setFormValues}
            />
            <CustomInput label='Repo' placeholder='e.g. bitcoin' name='repo' type='text' value={repo} setFormValues={setFormValues} />
          </section>
          <CustomInput
            label='Pull request number'
            placeholder='e.g. 8128'
            name='pull_number'
            type='number'
            value={pull_number === 0 ? "" : pull_number}
            setFormValues={setFormValues}
          />
          {error && <p className='text-center text-red-600 font-semibold'>{error}</p>}
          <button
            className='border border-gray-400 dark:hover:bg-black dark:border-white hover:bg-gray-300 dark:hover:opacity-70 rounded-md w-full px-12 py-[16px] whitespace-nowrap font-semibold'
            type='submit'
          >
            Run FreshEyes
          </button>
        </form>

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
            title={`Please install the FreshEyes bot in the clone of your Repo:`}
            spanTitle={`${username}/${repo}`}
            message={
              <section className=''>
                <ol className='list-disc list-inside flex flex-col gap-2 py-4 pt-1'>
                  <li>The FreshEyes bot recreates comments and reviews of your chosen pull request.</li>
                  <li>The bot only reads pull requests associated with FreshEyes, and no other data.</li>
                </ol>
                <p className='font-semibold text-base underline pt-4 pb-2'>Steps</p>
                <ol className='list-decimal list-inside flex flex-col gap-2 py-4 pt-0'>
                  <li>
                    FreshEyes will automatically clone{" "}
                    <Link target='_blank' className='underline hover:opacity-70' href={`https://github.com/${formValues.owner}/${formValues.repo}`}>
                      {repo}
                    </Link>{" "}
                    to your account.
                  </li>
                  <li>
                    To install the bot, click the{" "}
                    <span className='bg-gray-600 leading-[250%] p-1 font-semibold rounded-sm text-xs text-white'>Install FreshEyes Bot</span> button
                    below.
                  </li>
                  <li>In the new screen, click on your username.</li>
                  <li>
                    In the new page click <span>"Only select repositories"</span>.
                  </li>
                  <li>
                    In the <span className='bg-gray-600 text-white leading-[250%] p-1 font-semibold rounded-sm text-xs'>Select repositories</span>{" "}
                    dropdown, select "{username}/{repo}".
                  </li>
                  <li>Click "Install".</li>
                </ol>
              </section>
            }
            linkName='Install FreshEyes Bot'
            href={`https://github.com/apps/${INSTALLATION_URL}/installations/new`}
          />
        ) : null}
        <SuccessModal />
      </div>

      <div className='flex flex-col gap-6 overflow-x-scroll max-w-5xl  xl:w-3/4 md:p-4 w-full'>
        <h2 className='text-base md:text-xl font-semibold'>Clone some of the repos below to see FreshEyes in action</h2>
        <section className='flex flex-col md:flex-row w-full gap-6'>
          <ClickableOptions
            owner={"bitcoin"}
            repo={"bitcoin"}
            pull_number={8149}
            setFormValues={setFormValues}
            title={"Segregated witness (Segwit)"}
          />
          <ClickableOptions
            owner={"bitcoindevkit"}
            repo={"bdk"}
            pull_number={593}
            setFormValues={setFormValues}
            title={"Add support for Taproot and tr() descriptors"}
          />
        </section>
        <section className='flex flex-col md:flex-row w-full gap-6'>
          <ClickableOptions
            owner={"lightningnetwork"}
            repo={"lnd"}
            pull_number={2022}
            setFormValues={setFormValues}
            title={"Htlcswitch: hodl invoice"}
          />
          <ClickableOptions
            owner={"bitcoin-dev-project"}
            repo={"sim-ln"}
            pull_number={165}
            setFormValues={setFormValues}
            title={"Add Ability to Run as Full Simulator"}
          />
        </section>
      </div>
    </div>
  );
};

export default FormSection;
