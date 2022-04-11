import csv
import math
import numpy as np
import pandas as pd
import sys
import json
from PIL import Image
from tifffile import imread
from json import JSONEncoder
import os


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


class Nucleus(object):
    def __init__(self, size, edges, id):
        self.size = size
        self.edges = edges
        self.id = id
        # calculate center


# 2-D array with unique values:
args = json.load(open(sys.argv[1], 'r'))
detections = np.asarray(args)
detections = detections.astype(int)
print(detections.shape)
print(detections[30][120:160])

# Nucleus file here (2d array with unique values)
# detections = cv2.imread('L28Detections.tiff', -1)


my_set = {0}
for i in range(len(detections)):
    for j in range(len(detections[0])):
        my_set.add(detections[i][j])

num_nuclei = max(my_set)
num_nuclei

# get each nucleus' size and save the border into a list of points

arr = detections.copy()

nrows = len(arr)
ncols = len(arr[0])

sizes = []
ids_detected = {0}-{0}  # set()

edges = [[] for _ in range(num_nuclei)]
NUCLEUS = 9999

nuclei = []

for r in range(nrows):
    for c in range(ncols):
        if arr[r][c] != 0 and not arr[r][c] in ids_detected:
            nucleus_id = arr[r][c]
            ids_detected.add(nucleus_id)

            # BFS to find all pixels
            size = 0
            queue = []
            visited = {0}-{0}  # set()
            queue.append((r, c))

            dr = [-1, 0, 1, 0]
            dc = [0, -1, 0, 1]
            while(len(queue) > 0):
                r, c = queue.pop()
                visited.add((r, c))
                size += 1

                for i in range(4):
                    nr = r + dr[i]
                    nc = c + dc[i]

                    # OOB check
                    if nr < 0 or nr >= nrows or nc < 0 or nc >= ncols:
                        continue

                    # Already visited
                    if (nr, nc) in visited:
                        continue

                    # (r,c) is an edge of the nucleus
                    if arr[nr][nc] != nucleus_id:
                        edges[nucleus_id - 1].append((r, c))
                        continue

                    queue.append((nr, nc))

            sizes.append(size)
            nuclei.append(Nucleus(size, edges[nucleus_id - 1], nucleus_id))

# cytoplasm will store which pixels are the cytoplasm with which nucleus
# the cytoplasm is initialized with the detections to ensure we dont
# expland in the nucleus of the cells

ids_arr = detections.copy()

inf = 9999
distance = np.zeros((len(detections), len(detections[0])), dtype=float)
for r in range(len(detections)):
    for c in range(len(detections[0])):
        distance[r][c] = inf if detections[r][c] == 0 else -1


queue = []
for edge in edges:
    for r, c in edge:
        queue.append((r, c, ids_arr[r][c]))

while len(queue) > 0:
    # Remove next element for processing
    r, c, id = queue.pop(0)
    # check if ID has changed since last run
    if id != ids_arr[r][c]:
        continue

    #       D   L  U  R UR  DR  DL  UL
    dr = [-1,  0, 1, 0, 1, -1, -1,  1]
    dc = [0, -1, 0, 1, 1,  1, -1, -1]

    for i in range(len(dr)):
        # 1 for cardinal directions sqrt(2) for diags
        dis = 1 if (i <= 3) else math.sqrt(2)
        nr = r + dr[i]
        nc = c + dc[i]

        # OOB check
        if nr < 0 or nr >= nrows or nc < 0 or nc >= ncols:
            continue

        # TEMP
        if distance[nr][nc] != inf:
            continue

        # New shortest path to this pixel
        if distance[r][c] + dis < distance[nr][nc]:
            distance[nr][nc] = distance[r][c] + dis  # update distance
            ids_arr[nr][nc] = ids_arr[r][c]  # update ID for this position
            queue.append((nr, nc, ids_arr[r][c]))

# Mark cytoplasm as negative
mask = np.ma.masked_equal(detections, 0)
final_mask = np.where(detections == 0, ids_arr*(-1), ids_arr)
# print(final_mask.shape)

# Final mask is what you want, each cyto value is negative,
# the nucleus is positive
# plt.imsave(final_mask)

# image_pil = Image.fromarray(final_mask, 'I;16')
# image_pil.save('image_pil.jp2')
print(final_mask.dtype)
print(final_mask.shape)
final_mask = final_mask.astype('int16')
img1 = Image.fromarray(final_mask)
img1.save("test_file.tif")
array_2D = imread("./test_file.tif")

file_name = sys.argv[1]
file_name = file_name.replace("2D.json_", "")
if (sys.argv[2] == "No Project Loaded"):
    saveFile = os.path.join(os.path.expanduser(
        '~'), 'Documents', 'ZDFocus', 'Detect Cytoplasm', file_name+"_cytoplasm_2D.json")
else:
    saveFile = os.path.join(os.path.expanduser(
        '~'), 'Documents', 'ZDFocus', sys.argv[2], 'Detect Cytoplasm', file_name+"_cytoplasm_2D.json")

with open(saveFile, 'w') as fp:
    json.dump(array_2D, fp, cls=NumpyArrayEncoder)


# Temporarily saving the image in /tmp folder.
# image.save('/tmp/tmp2.jpg')


# image_array = np.uint16(np.random.rand(200, 200) * 65535)
# image_pil = Image.fromarray(image_array, 'I;16')
# image_pil.save('image_pil.jp2')


##### ------------------------------ ######

def get_stats(image_path, mask, csv_output_path='../tmp/cell_analysis.csv'):
  """
  Calulates important statistics for the input image given its corresponding detection mask
    and outputs it to a csv at the desired location.

  Parameters:
  -----------------
  image_path : str, the relative file path of the original .tiff image being analyzed
  mask : 2d_arr, 2d array where nuclei are marked with unique values 1-n (n = number of nuclei)
    and nuclei's cytoplasm is marked with its corresponding negative value
  csv_output_path : str, relative path the .csv should be output to (default is in tmp folder)
  """

  im = Image.open(image_path) 
  im.load()

  cyto_positions = [[] for _ in range(np.amax(mask))]
  nuclei_positions = [[] for _ in range(np.amax(mask))]

  for i in range(len(mask)):
    for j in range(len(mask[0])):
      val = mask[i][j]
      if val >= 0:
        nuclei_positions[val - 1].append((i,j))
      else:
        cyto_positions[val - 1].append((i,j))
  
  values = []
  for channel in range(im.n_frames):
    im.seek(channel)
    values.append(np.array(im))

  def calculate_cell(cyto_positions, nuclei_positions, values):
    def calculate_cell_helper(values, channel):
      nuclei_vals = [values[i][j] for i,j in nuclei_positions]
      cyto_vals = [values[i][j] for i,j in cyto_positions]
      cell_vals = [values[i][j] for i,j in (nuclei_positions + cyto_positions)]

      return {
              'Channel {}: Cell_Area'.format(str(channel)): len(cell_vals),
              'Channel {}: Cell_Mean'.format(str(channel)): np.mean(cell_vals),
              'Channel {}: Cell_Std_dev'.format(str(channel)): np.std(cell_vals), 
              'Channel {}: Cell_Max'.format(str(channel)): np.amax(cell_vals),
              'Channel {}: Cell_Min'.format(str(channel)): np.amin(cell_vals),
              'Channel {}: Nucleus_Area'.format(str(channel)): len(nuclei_vals),
              'Channel {}: Nucleus_Mean'.format(str(channel)): np.mean(nuclei_vals),
              'Channel {}: Nucleus_Std_dev'.format(str(channel)): np.std(nuclei_vals), 
              'Channel {}: Nucleus_Max'.format(str(channel)): np.amax(nuclei_vals),
              'Channel {}: Nucleus_Min'.format(str(channel)): np.amin(nuclei_vals),
              'Channel {}: Cytoplasm_Area'.format(str(channel)): len(cyto_vals),
              'Channel {}: Cytoplasm_Mean'.format(str(channel)): np.mean(cyto_vals),
              'Channel {}: Cytoplasm_Std_dev'.format(str(channel)): np.std(cyto_vals), 
              'Channel {}: Cytoplasm_Max'.format(str(channel)): np.amax(cyto_vals),
              'Channel {}: Cytoplasm_Min'.format(str(channel)): np.amin(cyto_vals)
            }

    data = [calculate_cell_helper(values[channel], channel) for channel in range(im.n_frames)]
    return {k: v for d in data for k, v in d.items()}
  
  # calculate stats for every cell detected
  stats = [calculate_cell(cyto_positions[cell], nuclei_positions[cell], values) for cell in range(len(cyto_positions))] 
  pd.DataFrame(stats).to_csv(csv_output_path)


# get_stats(image_path=???, mask=final_mask, csv_output_path='../tmp/tmp_analysis.csv')