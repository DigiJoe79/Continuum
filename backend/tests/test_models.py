# backend/tests/test_models.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
from models.project import Project
from models.asset import Asset, AssetType
from models.variant import Variant
from models.scene import Scene
from models.settings import Settings


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_create_project(db_session):
    project = Project(name="Test Project", description="A test project")
    db_session.add(project)
    db_session.commit()

    assert project.id is not None
    assert project.name == "Test Project"
    assert project.description == "A test project"
    assert project.created_at is not None


def test_create_asset_with_project(db_session):
    project = Project(name="Test Project")
    db_session.add(project)
    db_session.commit()

    asset = Asset(
        name="Anna",
        type=AssetType.CHARACTER,
        base_prompt="A young woman with red hair",
        project_id=project.id,
        is_global=False
    )
    db_session.add(asset)
    db_session.commit()

    assert asset.id is not None
    assert asset.type == AssetType.CHARACTER
    assert asset.project_id == project.id


def test_create_global_asset(db_session):
    asset = Asset(
        name="Cinematic",
        type=AssetType.STYLE,
        base_prompt="cinematic film still, dramatic lighting",
        project_id=None,
        is_global=True
    )
    db_session.add(asset)
    db_session.commit()

    assert asset.id is not None
    assert asset.is_global is True
    assert asset.project_id is None


def test_create_variant(db_session):
    project = Project(name="Test Project")
    db_session.add(project)
    db_session.commit()

    asset = Asset(
        name="Anna",
        type=AssetType.CHARACTER,
        base_prompt="A young woman with red hair",
        project_id=project.id,
        is_global=False
    )
    db_session.add(asset)
    db_session.commit()

    variant = Variant(
        name="Anna Angry",
        delta_prompt="angry expression, furrowed brow",
        asset_id=asset.id
    )
    db_session.add(variant)
    db_session.commit()

    assert variant.id is not None
    assert variant.name == "Anna Angry"
    assert variant.delta_prompt == "angry expression, furrowed brow"
    assert variant.asset_id == asset.id
    assert variant.asset == asset
    assert variant in asset.variants


def test_create_scene(db_session):
    # Create a project first
    project = Project(name="Test Project")
    db_session.add(project)
    db_session.commit()

    # Create a shot type asset
    shot_type = Asset(
        name="Close Up",
        type=AssetType.SHOT_TYPE,
        base_prompt="close up shot, detailed face",
        project_id=None,
        is_global=True
    )
    db_session.add(shot_type)
    db_session.commit()

    # Create a scene
    scene = Scene(
        name="Scene 1",
        project_id=project.id,
        shot_type_id=shot_type.id,
        action_text="Anna walks into the room",
        generated_prompt="A young woman walking into a dimly lit room"
    )
    db_session.add(scene)
    db_session.commit()

    assert scene.id is not None
    assert scene.name == "Scene 1"
    assert scene.project_id == project.id
    assert scene.shot_type_id == shot_type.id
    assert scene.action_text == "Anna walks into the room"
    assert scene.generated_prompt == "A young woman walking into a dimly lit room"
    assert scene.project == project
    assert scene.shot_type == shot_type
    assert scene in project.scenes


def test_create_scene_without_shot_type(db_session):
    # Create a project first
    project = Project(name="Test Project")
    db_session.add(project)
    db_session.commit()

    # Create a scene without shot_type (nullable)
    scene = Scene(
        name="Scene 2",
        project_id=project.id,
        shot_type_id=None,
        action_text="The sun sets over the horizon"
    )
    db_session.add(scene)
    db_session.commit()

    assert scene.id is not None
    assert scene.name == "Scene 2"
    assert scene.project_id == project.id
    assert scene.shot_type_id is None
    assert scene.shot_type is None


def test_create_settings(db_session):
    setting = Settings(
        key="default_model",
        value="gpt-4"
    )
    db_session.add(setting)
    db_session.commit()

    assert setting.id is not None
    assert setting.key == "default_model"
    assert setting.value == "gpt-4"
    assert setting.created_at is not None
    assert setting.updated_at is not None


def test_create_lighting_setup_asset(db_session):
    """Test that LIGHTING_SETUP asset type exists and can be created."""
    lighting = Asset(
        name="Golden Hour",
        type=AssetType.LIGHTING_SETUP,
        base_prompt='{"core": "golden hour", "standard": "warm tones", "detail": "lens flare"}',
        is_global=True
    )
    db_session.add(lighting)
    db_session.commit()

    assert lighting.id is not None
    assert lighting.type == AssetType.LIGHTING_SETUP


def test_create_scene_with_lighting(db_session):
    """Test that Scene can have a lighting_id reference."""
    project = Project(name="Test Project")
    db_session.add(project)
    db_session.commit()

    lighting = Asset(
        name="Studio Lighting",
        type=AssetType.LIGHTING_SETUP,
        base_prompt='{"core": "studio", "standard": "3-point", "detail": "softbox"}',
        is_global=True
    )
    db_session.add(lighting)
    db_session.commit()

    scene = Scene(
        name="Test Scene",
        project_id=project.id,
        lighting_id=lighting.id,
        action_text="Test action"
    )
    db_session.add(scene)
    db_session.commit()

    assert scene.lighting_id == lighting.id
    assert scene.lighting.name == "Studio Lighting"
