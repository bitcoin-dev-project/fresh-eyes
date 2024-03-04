// package: fresheyes
// file: fresheyes.proto

var fresheyes_pb = require("./fresheyes_pb");
var grpc = require("@improbable-eng/grpc-web").grpc;

var GitHubService = (function () {
  function GitHubService() {}
  GitHubService.serviceName = "fresheyes.GitHubService";
  return GitHubService;
}());

GitHubService.ForkRepository = {
  methodName: "ForkRepository",
  service: GitHubService,
  requestStream: false,
  responseStream: false,
  requestType: fresheyes_pb.ForkRequest,
  responseType: fresheyes_pb.ForkResult
};

GitHubService.CreateBranch = {
  methodName: "CreateBranch",
  service: GitHubService,
  requestStream: false,
  responseStream: false,
  requestType: fresheyes_pb.Branch,
  responseType: fresheyes_pb.Branch
};

GitHubService.CreatePullRequest = {
  methodName: "CreatePullRequest",
  service: GitHubService,
  requestStream: false,
  responseStream: false,
  requestType: fresheyes_pb.PullRequest,
  responseType: fresheyes_pb.PullRequestDetails
};

GitHubService.ProcessPullRequest = {
  methodName: "ProcessPullRequest",
  service: GitHubService,
  requestStream: false,
  responseStream: false,
  requestType: fresheyes_pb.PullRequest,
  responseType: fresheyes_pb.PrResponse
};

exports.GitHubService = GitHubService;

function GitHubServiceClient(serviceHost, options) {
  this.serviceHost = serviceHost;
  this.options = options || {};
}

GitHubServiceClient.prototype.forkRepository = function forkRepository(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(GitHubService.ForkRepository, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

GitHubServiceClient.prototype.createBranch = function createBranch(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(GitHubService.CreateBranch, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

GitHubServiceClient.prototype.createPullRequest = function createPullRequest(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(GitHubService.CreatePullRequest, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

GitHubServiceClient.prototype.processPullRequest = function processPullRequest(requestMessage, metadata, callback) {
  if (arguments.length === 2) {
    callback = arguments[1];
  }
  var client = grpc.unary(GitHubService.ProcessPullRequest, {
    request: requestMessage,
    host: this.serviceHost,
    metadata: metadata,
    transport: this.options.transport,
    debug: this.options.debug,
    onEnd: function (response) {
      if (callback) {
        if (response.status !== grpc.Code.OK) {
          var err = new Error(response.statusMessage);
          err.code = response.status;
          err.metadata = response.trailers;
          callback(err, null);
        } else {
          callback(null, response.message);
        }
      }
    }
  });
  return {
    cancel: function () {
      callback = null;
      client.close();
    }
  };
};

exports.GitHubServiceClient = GitHubServiceClient;

