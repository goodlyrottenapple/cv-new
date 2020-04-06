import os, shutil, json, time
from pathlib import Path
from fastapi import APIRouter, File, UploadFile
from typing import Optional, List
from app.db import sources, eav_attributes, eav_values, eavs, discovery_settings, database, engine
from sqlalchemy.dialects.postgresql import insert

from app.api.process.phenopacket import process_phenopacket
from app.api.process.xlsx import process_xlsx
from app.api.process.vcf import process_vcf
from app.api.models import *
from sqlalchemy import case, select
from sqlalchemy.sql import text

router = APIRouter()

@router.get("/discovery/getAttributes")
async def get_attributes():
    query = select([
            eav_attributes.c.eav_attribute.label("attribute"),
        ])

    print(query.compile(compile_kwargs={"literal_binds": True}))

    return await database.fetch_all(query=query)


@router.get("/discovery/getSettings")
async def get_settings():
    query = select([
            discovery_settings.c.id,
        ])

    return await database.fetch_all(query=query)




@router.post("/discovery/getAttributeValues")
async def get_attributes_vals(payload: AttributeValues):
    attr_id = json.dumps(payload.attribute)

    string = '%' + payload.string + '%' if payload.string else ''
    stm = """select array_agg(x.value) 
              from (select value from eav_values where eav_id = :id"""
    if payload.string:
        stm = stm + ' and value like :str'
    if payload.limit:
        stm = stm + ' limit :limit'
    if payload.offset:
        stm = stm + ' offset :offset'
    stm = stm + ') x'

    print(text(stm))

    rs = engine.execute(text(stm), id=attr_id, limit=payload.limit, offset=payload.offset, str=string)
    
    return list(rs)[0]['array_agg']
    




@router.post("/discovery/setAttributeMeta")
async def set_attribute_meta(payload: AttributeMeta):
    attr_id = json.dumps(payload.attribute)
    print(payload.attribute, attr_id)
    nm = ''
    if payload.label is not None: 
        query = eav_lookup.update()\
            .values(label=payload.label)\
            .where(eav_lookup.c.id == attr_id)
        await database.execute(query=query)
    if payload.visible is not None: 
        print("updating visible")
        query = eav_lookup.update()\
            .values(visible=payload.visible)\
            .where(eav_lookup.c.id == attr_id)
        await database.execute(query=query)
    if payload.arbitrary_input is not None: 
        print("updating arbitrary_input")
        query = eav_lookup.update()\
            .values(arbitrary_input=payload.arbitrary_input)\
            .where(eav_lookup.c.id == attr_id)
        await database.execute(query=query)
    return {'status': 'success'}



@router.get("/discovery/loadSettings")
async def save_discovery_settings(id: str):
    query = select([discovery_settings.c.data]).where(discovery_settings.c.id == id)
    return await database.execute(query=query)



@router.post("/discovery/saveSettings")
async def save_discovery_settings(payload: DiscoverySettings):

    query = insert(discovery_settings).values(
            id=payload.id_,
            data=payload.data
        ).on_conflict_do_update(
                index_elements=['id'],
                set_ = dict(data=payload.data), 
            )

    return await database.execute(query=query)
     # {'status': 'success'}

