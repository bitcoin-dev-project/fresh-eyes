// package: fresheyes
// file: fresheyes.proto

import * as fresheyes_pb from "./fresheyes_pb";
import {grpc} from "@improbable-eng/grpc-web";

type GitHubServiceForkRepository = {
  readonly methodName: string;
  readonly service: typeof GitHubService;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof fresheyes_pb.ForkRequest;
  readonly responseType: typeof fresheyes_pb.ForkResult;
};

type GitHubServiceCreateBranch = {
  readonly methodName: string;
  readonly service: typeof GitHubService;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof fresheyes_pb.Branch;
  readonly responseType: typeof fresheyes_pb.Branch;
};

type GitHubServiceCreatePullRequest = {
  readonly methodName: string;
  readonly service: typeof GitHubService;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof fresheyes_pb.PullRequest;
  readonly responseType: typeof fresheyes_pb.PullRequestDetails;
};

type GitHubServiceProcessPullRequest = {
  readonly methodName: string;
  readonly service: typeof GitHubService;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof fresheyes_pb.PullRequest;
  readonly responseType: typeof fresheyes_pb.PrResponse;
};

export class GitHubService {
  static readonly serviceName: string;
  static readonly ForkRepository: GitHubServiceForkRepository;
  static readonly CreateBranch: GitHubServiceCreateBranch;
  static readonly CreatePullRequest: GitHubServiceCreatePullRequest;
  static readonly ProcessPullRequest: GitHubServiceProcessPullRequest;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class GitHubServiceClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  forkRepository(
    requestMessage: fresheyes_pb.ForkRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.ForkResult|null) => void
  ): UnaryResponse;
  forkRepository(
    requestMessage: fresheyes_pb.ForkRequest,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.ForkResult|null) => void
  ): UnaryResponse;
  createBranch(
    requestMessage: fresheyes_pb.Branch,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.Branch|null) => void
  ): UnaryResponse;
  createBranch(
    requestMessage: fresheyes_pb.Branch,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.Branch|null) => void
  ): UnaryResponse;
  createPullRequest(
    requestMessage: fresheyes_pb.PullRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.PullRequestDetails|null) => void
  ): UnaryResponse;
  createPullRequest(
    requestMessage: fresheyes_pb.PullRequest,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.PullRequestDetails|null) => void
  ): UnaryResponse;
  processPullRequest(
    requestMessage: fresheyes_pb.PullRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.PrResponse|null) => void
  ): UnaryResponse;
  processPullRequest(
    requestMessage: fresheyes_pb.PullRequest,
    callback: (error: ServiceError|null, responseMessage: fresheyes_pb.PrResponse|null) => void
  ): UnaryResponse;
}

