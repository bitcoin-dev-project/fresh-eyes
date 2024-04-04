"use client";

import React, { useState } from "react";

import Modal from "../modal/Modal";
import { processPr } from "./proceess-pr";
import { PullRequest, PullRequestResponse } from "@/types";
import { checkIfAppInstalledInRepo, forkRepository } from "./bot";
import { INSTALLATION_URL } from "@/config/process";
import { ClickableOptions, CustomInput } from "./CustomComponents";

const FormSection = () => {
  const [link, setLink] = useState("");
  const [isBotInstalled, setIsBotInstalled] = useState(false);
  const [loading, setLoading] = useState({
    loader: false,
    modal: false,
    isInstalledModal: false,
  });
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState<PullRequest>({
    owner: "",
    repo: "",
    pull_number: 0,
  });

  const { owner, repo, pull_number } = formValues;

  const processPullRequest = async (clickable: boolean, clickableArgs: PullRequest) => {
    setLink("");
    setError("");
    setLoading({ loader: false, modal: false, isInstalledModal: false });

    if (pull_number === 0 && clickable === false) {
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
    let response:
      | {
          error: string;
          data: null;
        }
      | {
          error: null;
          data: PullRequestResponse;
        } = { error: "", data: null };

    if (clickable) {
      response = await processPr({
        owner: clickableArgs.owner.trim(),
        repo: clickableArgs.repo.trim(),
        pull_number: clickableArgs.pull_number,
      });
    }

    response = await processPr({
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
        <div className='mt-8 flex flex-col gap-6 border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto rounded-md lg:border lg:bg-gray-200 p-4 md:p-8 lg:dark:bg-zinc-800/30'>
          <h1>Please enter the following details to run fresheyes</h1>
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
          {error && <p className=' text-center text-red-600 font-semibold'>{error}</p>}
          <button
            className='border border-white hover:opacity-70 rounded-md w-full px-12 py-[16px] whitespace-nowrap font-semibold'
            onClick={() => processPullRequest(false, { owner: "", repo: "", pull_number: 0 })}
          >
            Run Fresheyes
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
                <div>
                  <p>
                    Please install the FreshEyes bot to the fork of your Repo:{" "}
                    <span className='underline'>
                      {owner}/{repo}
                    </span>
                  </p>
                  <ol className=' list-disc list-inside flex flex-col gap-2 py-4 pt-1'>
                    <li>The Fresheyes bot recreates the comments and reviews of your chosen pull request.</li>{" "}
                    <li>The bot only reads pull requests associated with Fresheyes, and no other data.</li>
                  </ol>
                </div>
                <p className=' font-semibold text-base underline pt-4 pb-2'>Steps</p>
                <ol className=' list-decimal list-inside flex flex-col gap-2 py-4 pt-0'>
                  <li>Follow the installation link below to start.</li>
                  <li>Select the repository where you want to install the fresheyes bot.</li>
                  <li>
                    Click on the <span className='bg-gray-600 leading-[250%] p-1 font-semibold rounded-sm text-xs'>Select repositories</span> button
                    to add the repository you want to install the bot in.
                  </li>
                  <li>
                    Click on the <span className=' bg-green-500 p-1 leading-[250%] font-semibold rounded-sm text-xs'>Save</span> button to complete
                    the process.
                  </li>
                  <li>After a successful installation you'll be redirected to start using Fresheyes.</li>
                </ol>
              </section>
            }
            linkName='Install FreshEyes Bot'
            href={`https://github.com/apps/${INSTALLATION_URL}/installations/new`}
          />
        ) : null}
      </div>

      <div className='flex flex-col gap-6 overflow-x-scroll max-w-5xl  xl:w-3/4 md:p-4 w-full'>
        <section className='flex flex-col md:flex-row w-full gap-6'>
          <ClickableOptions
            owner={"bitcoin"}
            repo={"bitcoin"}
            pull_number={8149}
            onClickOption={() => processPullRequest(true, { owner: "bitcoin", repo: "bitcoin", pull_number: 8149 })}
            setFormValues={setFormValues}
          />
          <ClickableOptions
            owner={"bitcoindevkit"}
            repo={"bdk"}
            pull_number={593}
            onClickOption={() => processPullRequest(true, { owner: "bitcoindevkit", repo: "bdk", pull_number: 593 })}
            setFormValues={setFormValues}
          />
        </section>
        <section className='flex flex-col md:flex-row w-full gap-6'>
          <ClickableOptions
            owner={"lightningnetwork"}
            repo={"lnd"}
            pull_number={2022}
            onClickOption={() => processPullRequest(true, { owner: "lightningnetwork", repo: "lnd", pull_number: 2022 })}
            setFormValues={setFormValues}
          />
          <ClickableOptions
            owner={"bitcoin-dev-project"}
            repo={"sim-ln"}
            pull_number={165}
            onClickOption={() => processPullRequest(true, { owner: "bitcoin-dev-project", repo: "sim-ln", pull_number: 165 })}
            setFormValues={setFormValues}
          />
        </section>
      </div>
    </div>
  );
};

export default FormSection;
