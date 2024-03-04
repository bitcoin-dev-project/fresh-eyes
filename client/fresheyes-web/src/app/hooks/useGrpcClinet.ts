import { GRPC_URL } from "@/config/process";
import { GitHubServiceClient } from "@/proto/fresheyes_pb_service";

export const useGrpcClient = () => {
  const client = new GitHubServiceClient(GRPC_URL);

  return { client };
};
