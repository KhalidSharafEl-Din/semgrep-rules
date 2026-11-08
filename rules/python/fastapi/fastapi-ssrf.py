import os
import urllib.request
from typing import Annotated
from urllib.parse import urljoin

import aiohttp
import httpx
import requests
from fastapi import APIRouter, Depends, FastAPI, Query, Request
from pydantic import BaseModel

app = FastAPI()
router = APIRouter()

PARTNER_API = "https://partner.example.com/v1/"
INVENTORY_API = os.environ["INVENTORY_API"]


class Settings:
    users_api: str = "https://users.internal.example.com"


settings = Settings()


class Webhook(BaseModel):
    callback_url: str


def get_settings():
    return {"status_url": "https://status.example.com/health"}


@app.get("/preview")
def preview(url: str):
    # ruleid: fastapi-ssrf
    return requests.get(url, timeout=5).text


@app.post("/webhooks/test")
async def test_webhook(hook: Webhook):
    async with httpx.AsyncClient() as client:
        # ruleid: fastapi-ssrf
        resp = await client.post(hook.callback_url, json={"ping": True})
    return {"status": resp.status_code}


@router.get("/fetch")
async def fetch_from_query(request: Request):
    target = request.query_params.get("target")
    async with aiohttp.ClientSession() as session:
        # ruleid: fastapi-ssrf
        async with session.get(target) as resp:
            return await resp.text()


@router.get("/avatar")
def avatar(image_url: str):
    # ruleid: fastapi-ssrf
    data = urllib.request.urlopen(image_url).read()
    return {"size": len(data)}


@app.get("/proxy")
def proxy(host: str, path: str):
    # ruleid: fastapi-ssrf
    return httpx.request("GET", f"http://{host}/{path}").text


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    async with httpx.AsyncClient() as client:
        # ok: fastapi-ssrf
        resp = await client.get(f"https://users.example.com/api/{user_id}")
    return resp.json()


@app.get("/partner/{item_id}")
def partner_item(item_id: str):
    # ok: fastapi-ssrf
    return requests.get(PARTNER_API + item_id, timeout=5).json()


@app.get("/status")
def status(settings: dict = Depends(get_settings)):
    # ok: fastapi-ssrf
    return requests.get(settings["status_url"], timeout=5).status_code


def not_a_route(url: str):
    # ok: fastapi-ssrf
    return requests.get(url, timeout=5)


@app.get("/preview-query")
def preview_query(url: str = Query(..., description="Page to preview")):
    # ruleid: fastapi-ssrf
    return httpx.get(url).text


@app.get("/annotated-status")
def annotated_status(settings_dep: Annotated[dict, Depends(get_settings)]):
    # ok: fastapi-ssrf
    return httpx.get(settings_dep["status_url"]).status_code


@app.get("/config/users/{user_id}")
async def config_user(user_id: int):
    async with httpx.AsyncClient() as client:
        # ok: fastapi-ssrf
        a = await client.get(f"{settings.users_api}/users/{user_id}")
        # ok: fastapi-ssrf
        b = await client.get(settings.users_api + "/users/" + str(user_id))
        # ok: fastapi-ssrf
        c = await client.get(urljoin(INVENTORY_API, f"items/{user_id}"))
        # ok: fastapi-ssrf
        d = await client.get("{}/users/{}".format(os.getenv("USERS_API"), user_id))
    return [a.status_code, b.status_code, c.status_code, d.status_code]


@app.get("/user-base")
def user_base(base: str, user_id: int):
    # ruleid: fastapi-ssrf
    return requests.get(f"{base}/users/{user_id}", timeout=5).text
