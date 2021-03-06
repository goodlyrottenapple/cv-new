import json, datetime, os, app.utils.VCF as VCF
from sqlalchemy.dialects.postgresql import insert

from app.db import eavs, eav_attributes, eav_values, sources, database, engine 
from app.utils.process import processing_done, clean_up_eav_values
from app.utils.types import supertype, cast_
from app.utils.paths import map_, get_leaf

import multiprocessing as mp
import time, csv, asyncio



def try_parse(key, value):
    try:
        return int(value), int
    except ValueError:
        if key == 'ExAC_AC':
            print("Couldnt cast '" + value + "' to int")
        try:
            return float(value), float
        except ValueError:
            if key == 'ExAC_AC':
                print("Couldnt cast " + value + " to int or float")
            return value, str


def create_eav_structure_vcf(source_id, file_name, empty_delim):
    counter = 0
    max_count = 100000
    eav = {}
    eav_types = {}

    for v in VCF.lines(file_name):
        counter = counter + 1
        if (counter > max_count):
            break
        if (counter % 10000 == 0):
            print("processing...")
        d_v = dict(v)
        for key, value in d_v.items():
            if value:
                if type(value) is list and len(value) == 1:
                    value = value[0]

                if key in eav:
                    if type(eav_types[key]) is list and type(value) is list:
                        tys = [try_parse(key, x)[1] for x in value if x not in empty_delim]
                        s_ty = supertype(set(eav_types[key] + tys))
                        eav_types[key] = [s_ty]

                        eav[key].update([x for x in value if x not in empty_delim])
                    elif type(eav_types[key]) is list and type(value) is not list:
                        if value not in empty_delim:
                            _, ty = try_parse(key, value)
                            s_ty = supertype(set([eav_types[key][0], ty]))
                            eav_types[key] = [s_ty]

                            eav[key].add(value)
                    elif type(eav_types[key]) is not list and type(value) is list:
                        tys = [try_parse(key, x)[1] for x in value if x not in empty_delim]
                        s_ty = supertype(set([eav_types[key]] + tys))
                        eav_types[key] = [s_ty]

                        eav[key].update([x for x in value if x not in empty_delim])
                    else:
                        if value not in empty_delim:
                            _, ty = try_parse(key, value)
                            s_ty = supertype(set([eav_types[key], ty]))
                            eav_types[key] = s_ty

                            eav[key].add(value)
                else:
                    if type(value) is list:
                        tys = [try_parse(key, x)[1] for x in value if x not in empty_delim]
                        if tys:
                            s_ty = supertype(set(tys))
                            eav_types[key] = [s_ty]

                            eav[key] = set(value)
                    elif value not in empty_delim:
                        _, ty = try_parse(key, value)
                        eav_types[key] = ty

                        eav[key] = {value}

    for key in eav_types.keys():
        p = {}

        if type(eav_types[key]) is list:
            p[key] = [eav_types[key][0].__name__]
            ty = eav_types[key][0]
        else:
            p[key] = eav_types[key].__name__
            ty = eav_types[key]


        if ty is int or ty is float:
            arbitrary_input = True
        else:
            arbitrary_input = False

        values = map_(list(eav[key]), cast_(eav_types[key]))

        # query = insert(eav_lookup).values(
        #         id=json.dumps(p),
        #         source_id=source_id,
        #         eav_attribute= p,
        #         visible=True,
        #         arbitrary_input=arbitrary_input,
        #         eav_values= values
        #     ).on_conflict_do_update(
        #         index_elements=['id'],
        #         set_ = dict(eav_values=eav_lookup.c.eav_values + values), 
        #     )

        # await database.execute(query=query)  
    return eav_types



# async def process_wrapper(source_id, file_name, empty_delim, eav_types, chunkStart, chunkSize):
#     start = time.time()
#     count = 0
#     with open(file_name) as f:
#         f.seek(chunkStart)
#         lines = f.read(chunkSize).splitlines()
#         buf = []

#         for line in lines:
#             if line.startswith('#'):
#                 continue
#             else:
#                 count = count + 1
#                 d_v = dict(VCF.parse(line))
#                 data = {}
#                 for key, value in d_v.items():
#                     if value:
#                         if type(eav_types[key]) is list and type(value) is list:
#                             data[key] = map([x for x in value if x not in empty_delim], cast_(eav_types[key]))
#                         elif type(eav_types[key]) is list and type(value) is not list and value not in empty_delim:
#                            data[key] = [cast_(eav_types[key])(value)]
#                         elif value not in empty_delim:
#                             data[key] = cast_(eav_types[key])(value)
#                 if 'ID' in data.keys():
#                     subject_id = data['ID']
#                 else:
#                     subject_id = ''


#                 buf.append({
#                         'source_id': source_id,
#                         'subject_id': subject_id,
#                         'data': data
#                     })
#                 if len(buf) % 10000 == 0:
#                     engine.execute(eavs.insert(), buf)
#                     buf = []

#         engine.execute(eavs.insert(), buf)


#     end = time.time()
#     print("Finished chunk ", chunkStart, "time:", end - start, "count: ", count, "per second: ", count / (end - start))






# async def process_wrapper_csv(source_id, file_name, empty_delim, eav_types, chunkStart, chunkSize):
#     start = time.time()
#     count = 0
#     with open(file_name) as f:
#         f.seek(chunkStart)
#         lines = f.read(chunkSize).splitlines()
#         buf = []

#         for line in lines:
#             if line.startswith('#'):
#                 continue
#             else:
#                 count = count + 1
#                 d_v = dict(VCF.parse(line))
#                 data = {}
#                 for key, value in d_v.items():
#                     if value:
#                         if type(eav_types[key]) is list and type(value) is list:
#                             data[key] = map([x for x in value if x not in empty_delim], cast_(eav_types[key]))
#                         elif type(eav_types[key]) is list and type(value) is not list and value not in empty_delim:
#                            data[key] = [cast_(eav_types[key])(value)]
#                         elif value not in empty_delim:
#                             data[key] = cast_(eav_types[key])(value)
#                 if 'ID' in data.keys():
#                     subject_id = data['ID']
#                 else:
#                     subject_id = ''


#                 buf.append({
#                         'source_id': source_id,
#                         'subject_id': subject_id,
#                         'data': data
#                     })

    end = time.time()
    print("Finished chunk ", chunkStart, "time:", end - start, "count: ", count, "per second: ", count / (end - start))
    # return buf


# def chunkify(fname,size=1024*1024):
#     fileEnd = os.path.getsize(fname)
#     with open(fname, 'rb') as f:
#         chunkEnd = f.tell()
#         while True:
#             chunkStart = chunkEnd
#             f.seek(size,1)
#             f.readline()
#             chunkEnd = f.tell()
#             yield chunkStart, chunkEnd - chunkStart
#             if chunkEnd > fileEnd:
#                 break


def try_parse_ty(value):
    try:
        int(value)
        return int
    except ValueError:
        try:
            float(value)
            return float
        except ValueError:
            return str


async def process_old(source_id, file_name, empty_delim, eav_types):
    start = time.time()
    count = 0
    max_count = 10000000
    buf = []
    bufVal = []
    eav_attrs = set()
    eav_attr_vals = {}

    for v in VCF.lines(file_name):
        count = count + 1
        if (count > max_count):
            break
        d_v = dict(v)
        data = {}

        subject_id = d_v['ID'] if 'ID' in d_v.keys() and d_v['ID'] is not None else count
        

        for key, value in d_v.items():
            if value:

                attr = {}
                attr[key] = eav_types[key]
                attr = map_(attr, lambda x: x.__name__)
                eav_id = json.dumps(attr)
                if eav_id not in eav_attr_vals:
                    eav_attr_vals[eav_id] = set()

                if eav_id not in eav_attrs:
                    eav_attrs.add(eav_id)

                    queryAttr = insert(eav_attributes).values(
                            id=eav_id,
                            source_id=source_id,
                            eav_attribute=attr,
                        ).on_conflict_do_nothing()
                    await database.execute(query=queryAttr)

                if type(eav_types[key]) is list and type(value) is list:
                    for v in value:
                        if v not in eav_attr_vals[eav_id]:
                            eav_attr_vals[eav_id].add(v)

                            bufVal.append({
                                'eav_id': eav_id,
                                'value': v
                            })

                    data[key] = [cast_(eav_types[key])(x) for x in value if x not in empty_delim]

                elif type(eav_types[key]) is list and type(value) is not list and value not in empty_delim:
                    if value not in eav_attr_vals[eav_id]:
                        eav_attr_vals[eav_id].add(value)
                        bufVal.append({
                                'eav_id': eav_id,
                                'value': value
                            })

                    data[key] = [cast_(eav_types[key])(value)]
                elif value not in empty_delim:
                    if value not in eav_attr_vals[eav_id]:
                        eav_attr_vals[eav_id].add(value)
                        bufVal.append({
                                'eav_id': eav_id,
                                'value': value
                            })

                    data[key] = cast_(eav_types[key])(value)

        buf.append({
            'source_id': source_id,
            'subject_id': subject_id,
            'data': data
        })

        if len(bufVal) > 1000:
            print("got here...bufVal")
            engine.execute(eav_values.insert(), bufVal)
            bufVal = []

        if len(buf) > 1000:
            print("got here...")
            engine.execute(eavs.insert(), buf)
            end = time.time()
            buf = []
            print("per second: ", 1000 / (end - start))
            start = end

        

    engine.execute(eavs.insert(), buf)
    engine.execute(eav_values.insert(), bufVal)



async def process_vcf(source_id, file_name, empty_delim):
    eav_types = create_eav_structure_vcf(source_id, file_name, empty_delim)
    print("Finished preprocessing")

    # cores = 6
    # #init objects
    # pool = mp.Pool(cores)
    # jobs = []

    # max_count = 100000/17700
    # count = 0

    #create jobs
    # for chunkStart,chunkSize in chunkify(file_name):
    #     print("Appended chunk ", chunkStart)
    #     count = count + 1
    #     if (count > max_count):
    #         break
    #     await process_wrapper(source_id, file_name, empty_delim, eav_types, chunkStart,chunkSize)

    # # wait for all jobs to finish
    # with open(r'big_file.csv', 'w') as f:
    #     writer = csv.writer(f)
    #     w = None
    #     for job in jobs:
    #         row_list = job.get()
    #         if w is None:
    #             w = csv.DictWriter(f, row_list[0].keys())
    #             w.writeheader()
    #         w.writerows(row_list)

    # #clean up
    # pool.close()

    # print(source_id)
    await process_old(source_id, file_name, empty_delim, eav_types)

    clean_up_eav_values()
    await processing_done(source_id)
