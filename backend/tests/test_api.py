# backend/tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from main import app
from database import get_db
from models import Base


# Use a single test engine/connection for all tests
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="function")
def test_db():
    # Create all tables
    Base.metadata.create_all(bind=TEST_ENGINE)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TEST_ENGINE
    # Drop all tables after test
    Base.metadata.drop_all(bind=TEST_ENGINE)
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_db):
    return TestClient(app)


# Project Tests
def test_create_project(client):
    response = client.post("/api/projects", json={
        "name": "Test Project",
        "description": "A test project"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["id"] is not None


def test_list_projects(client):
    # Create a project first
    client.post("/api/projects", json={"name": "Project 1"})
    client.post("/api/projects", json={"name": "Project 2"})

    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_project(client):
    create_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = create_response.json()["id"]

    response = client.get(f"/api/projects/{project_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Project"


def test_update_project(client):
    create_response = client.post("/api/projects", json={"name": "Original Name"})
    project_id = create_response.json()["id"]

    response = client.put(f"/api/projects/{project_id}", json={"name": "Updated Name"})
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_delete_project(client):
    create_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = create_response.json()["id"]

    response = client.delete(f"/api/projects/{project_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 404


def test_get_nonexistent_project(client):
    response = client.get("/api/projects/99999")
    assert response.status_code == 404


# Asset Tests
def test_create_asset(client):
    # Create project first
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    response = client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "base_prompt": "A young woman with red hair",
        "project_id": project_id
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Anna"
    assert data["type"] == "character"


def test_list_assets_by_project(client):
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "project_id": project_id
    })

    response = client.get(f"/api/assets?project_id={project_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Anna"


def test_list_assets_by_type(client):
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "project_id": project_id
    })
    client.post("/api/assets", json={
        "name": "Forest",
        "type": "location",
        "project_id": project_id
    })

    response = client.get("/api/assets?type=character")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "character"


def test_create_global_asset(client):
    response = client.post("/api/assets", json={
        "name": "Custom Style",
        "type": "style",
        "base_prompt": "custom style prompt",
        "is_global": True
    })
    assert response.status_code == 201
    assert response.json()["is_global"] is True


def test_list_global_assets(client):
    client.post("/api/assets", json={
        "name": "Global Style",
        "type": "style",
        "base_prompt": "global style",
        "is_global": True
    })
    client.post("/api/assets", json={
        "name": "Project Style",
        "type": "style",
        "base_prompt": "project style",
        "is_global": False
    })

    response = client.get("/api/assets?is_global=true")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["is_global"] is True


def test_get_asset(client):
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    create_response = client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "base_prompt": "A young woman",
        "project_id": project_id
    })
    asset_id = create_response.json()["id"]

    response = client.get(f"/api/assets/{asset_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Anna"


def test_update_asset(client):
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    create_response = client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "base_prompt": "Original prompt",
        "project_id": project_id
    })
    asset_id = create_response.json()["id"]

    response = client.put(f"/api/assets/{asset_id}", json={
        "base_prompt": "Updated prompt"
    })
    assert response.status_code == 200
    assert response.json()["base_prompt"] == "Updated prompt"


def test_delete_asset(client):
    project_response = client.post("/api/projects", json={"name": "Test Project"})
    project_id = project_response.json()["id"]

    create_response = client.post("/api/assets", json={
        "name": "Anna",
        "type": "character",
        "project_id": project_id
    })
    asset_id = create_response.json()["id"]

    response = client.delete(f"/api/assets/{asset_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f"/api/assets/{asset_id}")
    assert get_response.status_code == 404
