from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1 import auth, services, schedule, appointments, clients, companies, public, uploads, client_portal, superadmin, specialties, website_sections, specialists, positions, section_templates, protocols, protocol_templates, inventory, accounting, billing, global_catalog, cities, education, education_public, referrals

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
app.include_router(uploads.router, prefix=settings.API_V1_PREFIX, tags=["uploads"])
app.include_router(client_portal.router, prefix=settings.API_V1_PREFIX, tags=["client-portal"])
app.include_router(superadmin.router, prefix=settings.API_V1_PREFIX, tags=["superadmin"])
app.include_router(specialties.router, prefix=settings.API_V1_PREFIX, tags=["specialties"])
app.include_router(website_sections.router, prefix=settings.API_V1_PREFIX, tags=["website"])
app.include_router(specialists.router, prefix=settings.API_V1_PREFIX, tags=["specialists"])
app.include_router(positions.router, prefix=settings.API_V1_PREFIX, tags=["positions"])
app.include_router(section_templates.router, prefix=settings.API_V1_PREFIX, tags=["section-templates"])
app.include_router(protocols.router, prefix=settings.API_V1_PREFIX, tags=["protocols"])
app.include_router(protocol_templates.router, prefix=settings.API_V1_PREFIX, tags=["protocol-templates"])
app.include_router(inventory.router, prefix=settings.API_V1_PREFIX, tags=["inventory"])
app.include_router(accounting.router, prefix=settings.API_V1_PREFIX, tags=["accounting"])
app.include_router(billing.router, prefix=settings.API_V1_PREFIX, tags=["billing"])
app.include_router(global_catalog.router, prefix=settings.API_V1_PREFIX, tags=["global-catalog"])
app.include_router(cities.router, prefix=settings.API_V1_PREFIX, tags=["cities"])
app.include_router(education.router, prefix=settings.API_V1_PREFIX, tags=["education"])
app.include_router(education_public.router, prefix=settings.API_V1_PREFIX, tags=["education-public"])
app.include_router(referrals.router, prefix=settings.API_V1_PREFIX, tags=["referrals"])

# Static files for uploads
static_dir = settings.BASE_DIR / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    return {"message": "Procedure Booking API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
