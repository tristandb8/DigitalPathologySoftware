import json
from json import JSONEncoder
import numpy


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


print('Hello World!')
numpyArrayOne = numpy.array([[11, 22, 33], [44, 55, 66], [77, 88, 99]])
numpyData = {"array": numpyArrayOne}
# use dump() to write array into file
encodedNumpyData = json.dumps(numpyData, cls=NumpyArrayEncoder)
print("Printing JSON serialized NumPy array")
print(encodedNumpyData)
