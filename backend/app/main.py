from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, services, schedule, appointments, clients, companies, public

app = FastAPI(
    title="Procedure Booking API",
    description="API for booking cosmetic procedures",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["auth"])
app.include_router(companies.router, prefix=settings.API_V1_PREFIX, tags=["companies"])
app.include_router(services.router, prefix=settings.API_V1_PREFIX, tags=["services"])
app.include_router(schedule.router, prefix=settings.API_V1_PREFIX, tags=["schedule"])
app.include_router(appointments.router, prefix=settings.API_V1_PREFIX, tags=["appointments"])
app.include_router(clients.router, prefix=settings.API_V1_PREFIX, tags=["clients"])
app.include_router(public.router, prefix=settings.API_V1_PREFIX, tags=["public"])


@app.get("/")
async def root():
    return {"message": "Procedure Booking API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
