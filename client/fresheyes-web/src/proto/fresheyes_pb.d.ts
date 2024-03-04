// package: fresheyes
// file: fresheyes.proto

import * as jspb from "google-protobuf";

export class PullRequestDetails extends jspb.Message {
  getBaseSha(): string;
  setBaseSha(value: string): void;

  getHeadSha(): string;
  setHeadSha(value: string): void;

  getBaseRef(): string;
  setBaseRef(value: string): void;

  getHeadRef(): string;
  setHeadRef(value: string): void;

  getTitle(): string;
  setTitle(value: string): void;

  getBody(): string;
  setBody(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PullRequestDetails.AsObject;
  static toObject(includeInstance: boolean, msg: PullRequestDetails): PullRequestDetails.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PullRequestDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PullRequestDetails;
  static deserializeBinaryFromReader(message: PullRequestDetails, reader: jspb.BinaryReader): PullRequestDetails;
}

export namespace PullRequestDetails {
  export type AsObject = {
    baseSha: string,
    headSha: string,
    baseRef: string,
    headRef: string,
    title: string,
    body: string,
  }
}

export class PullRequest extends jspb.Message {
  getOwner(): string;
  setOwner(value: string): void;

  getRepo(): string;
  setRepo(value: string): void;

  getTitle(): string;
  setTitle(value: string): void;

  getBody(): string;
  setBody(value: string): void;

  getHead(): string;
  setHead(value: string): void;

  getBase(): string;
  setBase(value: string): void;

  getPullNumber(): number;
  setPullNumber(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PullRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PullRequest): PullRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PullRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PullRequest;
  static deserializeBinaryFromReader(message: PullRequest, reader: jspb.BinaryReader): PullRequest;
}

export namespace PullRequest {
  export type AsObject = {
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string,
    pullNumber: number,
  }
}

export class Branch extends jspb.Message {
  getOwner(): string;
  setOwner(value: string): void;

  getRepo(): string;
  setRepo(value: string): void;

  getBranchRef(): string;
  setBranchRef(value: string): void;

  getSha(): string;
  setSha(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Branch.AsObject;
  static toObject(includeInstance: boolean, msg: Branch): Branch.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Branch, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Branch;
  static deserializeBinaryFromReader(message: Branch, reader: jspb.BinaryReader): Branch;
}

export namespace Branch {
  export type AsObject = {
    owner: string,
    repo: string,
    branchRef: string,
    sha: string,
  }
}

export class ForkRequest extends jspb.Message {
  getOwner(): string;
  setOwner(value: string): void;

  getRepo(): string;
  setRepo(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ForkRequest): ForkRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForkRequest;
  static deserializeBinaryFromReader(message: ForkRequest, reader: jspb.BinaryReader): ForkRequest;
}

export namespace ForkRequest {
  export type AsObject = {
    owner: string,
    repo: string,
  }
}

export class ForkResult extends jspb.Message {
  getOwner(): string;
  setOwner(value: string): void;

  getRepo(): string;
  setRepo(value: string): void;

  getForkedRepo(): string;
  setForkedRepo(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ForkResult.AsObject;
  static toObject(includeInstance: boolean, msg: ForkResult): ForkResult.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ForkResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ForkResult;
  static deserializeBinaryFromReader(message: ForkResult, reader: jspb.BinaryReader): ForkResult;
}

export namespace ForkResult {
  export type AsObject = {
    owner: string,
    repo: string,
    forkedRepo: string,
  }
}

export class UserFields extends jspb.Message {
  getLogin(): string;
  setLogin(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserFields.AsObject;
  static toObject(includeInstance: boolean, msg: UserFields): UserFields.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UserFields, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserFields;
  static deserializeBinaryFromReader(message: UserFields, reader: jspb.BinaryReader): UserFields;
}

export namespace UserFields {
  export type AsObject = {
    login: string,
  }
}

export class ReviewComment extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getBody(): string;
  setBody(value: string): void;

  getCommitId(): string;
  setCommitId(value: string): void;

  getPath(): string;
  setPath(value: string): void;

  getLine(): number;
  setLine(value: number): void;

  getStartLine(): number;
  setStartLine(value: number): void;

  getOriginalLine(): number;
  setOriginalLine(value: number): void;

  getPosition(): number;
  setPosition(value: number): void;

  getOriginalPosition(): number;
  setOriginalPosition(value: number): void;

  getSide(): string;
  setSide(value: string): void;

  getStartSide(): string;
  setStartSide(value: string): void;

  getUrl(): string;
  setUrl(value: string): void;

  getHtmlUrl(): string;
  setHtmlUrl(value: string): void;

  getSubjectType(): string;
  setSubjectType(value: string): void;

  getCreatedAt(): string;
  setCreatedAt(value: string): void;

  getUpdatedAt(): string;
  setUpdatedAt(value: string): void;

  hasUser(): boolean;
  clearUser(): void;
  getUser(): UserFields | undefined;
  setUser(value?: UserFields): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReviewComment.AsObject;
  static toObject(includeInstance: boolean, msg: ReviewComment): ReviewComment.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReviewComment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReviewComment;
  static deserializeBinaryFromReader(message: ReviewComment, reader: jspb.BinaryReader): ReviewComment;
}

export namespace ReviewComment {
  export type AsObject = {
    id: number,
    body: string,
    commitId: string,
    path: string,
    line: number,
    startLine: number,
    originalLine: number,
    position: number,
    originalPosition: number,
    side: string,
    startSide: string,
    url: string,
    htmlUrl: string,
    subjectType: string,
    createdAt: string,
    updatedAt: string,
    user?: UserFields.AsObject,
  }
}

export class ErrorResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

  getStatus(): number;
  setStatus(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ErrorResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ErrorResponse): ErrorResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ErrorResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ErrorResponse;
  static deserializeBinaryFromReader(message: ErrorResponse, reader: jspb.BinaryReader): ErrorResponse;
}

export namespace ErrorResponse {
  export type AsObject = {
    message: string,
    status: number,
  }
}

export class PrResponse extends jspb.Message {
  getPrUrl(): string;
  setPrUrl(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PrResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PrResponse): PrResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PrResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PrResponse;
  static deserializeBinaryFromReader(message: PrResponse, reader: jspb.BinaryReader): PrResponse;
}

export namespace PrResponse {
  export type AsObject = {
    prUrl: string,
  }
}

