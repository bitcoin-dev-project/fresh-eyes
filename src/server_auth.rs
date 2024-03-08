use actix_service::Transform;
use actix_web::{dev::{Service, ServiceRequest, ServiceResponse}, Error, HttpMessage, HttpResponse, ResponseError};
use futures_util::future::LocalBoxFuture;
use std::fmt;
use std::future::{ready, Ready};
use std::task::{Context, Poll};


use crate::app_data::AppData;


pub struct Authentication;

impl<S, B> Transform<S, ServiceRequest> for Authentication
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticationMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticationMiddleware { service }))
    }
}

pub struct AuthenticationMiddleware<S> {
    service: S,
}

struct UnauthorizedError;
impl ResponseError for UnauthorizedError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::Unauthorized().json("Unauthorized: Bearer token required")
    }
}

impl fmt::Debug for UnauthorizedError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "UnauthorizedError")
    }
}

impl fmt::Display for UnauthorizedError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Unauthorized: Bearer token required")
    }
}

impl<S, B> Service<ServiceRequest> for AuthenticationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }
    fn call(&self, req: ServiceRequest) -> Self::Future {
        let headers = req.headers().clone();
        let token = headers
            .get("Authorization")
            .and_then(|header| header.to_str().ok())
            .and_then(|header| {
                let mut parts = header.split(' ');
                match (parts.next(), parts.next()) {
                    (Some(scheme), Some(token)) if scheme == "Bearer" => Some(token.to_string()),
                    _ => None,
                }
            });

        if let Some(token) = token {
            // Create a new AppData instance with the token
            let app_data = AppData::new(token);
            // Store the AppData instance in the request extensions
            req.extensions_mut().insert(app_data.clone());
            let fut = self.service.call(req);
            Box::pin(fut)
        } else {
            Box::pin(async { Err(UnauthorizedError.into()) })
        }
    }


}
