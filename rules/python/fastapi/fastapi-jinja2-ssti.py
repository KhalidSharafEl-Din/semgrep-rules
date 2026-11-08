import jinja2
from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from jinja2 import Environment, Template
from jinja2.sandbox import SandboxedEnvironment
from pydantic import BaseModel

app = FastAPI()
env = Environment(autoescape=True)
templates = Jinja2Templates(directory="templates")
sandbox = SandboxedEnvironment()

GREETING = Template("Hello {{ name }}!")
EMAILS = {"welcome": "Welcome {{ name }}", "reset": "Reset your password, {{ name }}"}


class EmailPreview(BaseModel):
    subject: str
    body_template: str


@app.get("/greet", response_class=HTMLResponse)
def greet(name: str):
    # ruleid: fastapi-jinja2-ssti
    return Template("Hello " + name + "!").render()


@app.post("/email/preview", response_class=HTMLResponse)
async def email_preview(preview: EmailPreview):
    # ruleid: fastapi-jinja2-ssti
    tmpl = env.from_string(preview.body_template)
    return tmpl.render(subject=preview.subject)


@app.get("/banner", response_class=HTMLResponse)
def banner(text: str):
    # ruleid: fastapi-jinja2-ssti
    return jinja2.Template(f"<h1>{text}</h1>").render()


@app.get("/footer", response_class=HTMLResponse)
def footer(text: str):
    # ruleid: fastapi-jinja2-ssti
    return templates.env.from_string(text).render()


@app.get("/greet-safe", response_class=HTMLResponse)
def greet_safe(name: str):
    # ok: fastapi-jinja2-ssti
    return GREETING.render(name=name)


@app.get("/greet-env", response_class=HTMLResponse)
def greet_env(name: str):
    # ok: fastapi-jinja2-ssti
    return env.from_string("Hello {{ name }}!").render(name=name)


@app.get("/user-template", response_class=HTMLResponse)
def user_template(source: str):
    # ok: fastapi-jinja2-ssti
    return sandbox.from_string(source).render()


@app.get("/motd", response_class=HTMLResponse)
def motd(message: str = Query(default="Hello")):
    # ruleid: fastapi-jinja2-ssti
    return env.from_string(message).render()


@app.get("/email/{kind}", response_class=HTMLResponse)
def email(kind: str, name: str):
    # ok: fastapi-jinja2-ssti
    return env.from_string(EMAILS[kind]).render(name=name)
