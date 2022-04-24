from mrcnn.main import *
from mrcnn.utils import *
from mrcnn.config import Config
import math
from PIL import Image
import numpy
import warnings
import cv2
import sys
import json
from json import JSONEncoder
from tifffile import imread
import matplotlib.pyplot as plt
import pandas as pd
numpy.set_printoptions(threshold=sys.maxsize)


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


class Nucleus(object):
    def __init__(self, size, edges, id):
        self.size = size
        self.edges = edges
        self.id = id


###### ---------- CSV Creation and Helper Functions --------- ##############
def pnpoly(vert, test):
  testx, testy = test
  verty = [y for _,y in vert]
  vertx = [x for x,_ in vert]
  nvert = len(vert)
  c = False
  i = 0
  j = nvert-1
  while ( i < nvert ):
    if ( ((verty[i]>testy) != (verty[j]>testy)) and (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) ):
       c = not c
    j = i
    i += 1
  
  return c

def pncircle(annotation, query):
  (cx, cy), radius = annotation
  qx, qy = query
  return (cx - qx)**2 + (cy-qy)**2 <= radius**2


def get_stats(image_path, mask, annotation, csv_output_path):
  """
  Calulates important statistics for the input image given its corresponding detection mask
    and outputs it to a csv at the desired location.

  Parameters:
  -----------------
  image_path : str, the relative file path of the original .tiff image being analyzed
  mask : 2d_arr, 2d array where nuclei are marked with unique values 1-n (n = number of nuclei)
    and nuclei's cytoplasm is marked with its corresponding negative value
  annotation : List or Tuple, Values defining annoation, 
    if circle (center, radius) 
    if polygon [verticies]
  csv_output_path : str, relative path the .csv should be output to (default is in tmp folder)
  """
  is_in_annotation = None
  if isinstance(annotation, tuple):
    if len(annotation) != 2:
      raise ValueError(f'Incorrect input format for circle annotation: \
        expected len == 2, but got len == {len(annotation)}')
    if len(annotation[0]) != 2:
      raise ValueError(f'Incorrect input format for circle center (x,y): \
        expected len == 2, but got len == {len(annotation)}')
    is_in_annotation = pncircle

  elif isinstance(annotation, list):
    if len(annotation) == 0:
      raise ValueError(f'Incorrect input format for annotation: \
        expected len > 0, but got an empty list')
    is_in_annotation = pnpoly
  else:
    raise ValueError(f'Incorrect input format for annotation: \
        expected tuple or list, but got: {type(annotation)}')

  im = Image.open(image_path) 
  im.load()
  cyto_positions = [[] for _ in range(np.amax(mask))]
  nuclei_positions = [[] for _ in range(np.amax(mask))]

  for i in range(len(mask)):
    for j in range(len(mask[0])):

      # Skip pixels outside of annotation
      if not is_in_annotation(annotation, (i,j)):
        continue

      val = mask[i][j]
      if val >= 0:
        nuclei_positions[val - 1].append((i,j))
      else:
        cyto_positions[abs(val) - 1].append((i,j))
  
  channel_values = []
  for channel in range(im.n_frames):
    im.seek(channel)
    channel_values.append(np.array(im))

  def calculate_cell(cyto_positions, nuclei_positions):
    if(len(nuclei_positions) == 0 or len(cyto_positions) == 0):
        return None
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

    data = [calculate_cell_helper(channel_values[channel], channel) for channel in range(im.n_frames)]
    return {k: v for d in data for k, v in d.items()}

  
  # calculate stats for every cell detected
  stats = [calculate_cell(cyto_positions[cell], nuclei_positions[cell]) for cell in range(len(cyto_positions))] 
  stats = [stat for stat in stats if stat is not None]
  
  pd.DataFrame(stats).to_csv(csv_output_path)


if __name__ == '__main__':
    warnings.filterwarnings("ignore")

    # Image dimensions:
    x = int(sys.argv[3])  # Width
    y = int(sys.argv[4])  # Height

    # Getting the image from txt to array.
    tmp = numpy.zeros([x*y])
    im = json.load(open(sys.argv[2], 'r'))
    for i in range((x*y)):
        tmp[i] = float(im[str(i)])
    imageArray = np.reshape(tmp, (y, x))
    image_max = np.max(imageArray)
    if image_max > 0:
        imageArray = imageArray / image_max
        imageArray = imageArray * 255
    image = Image.fromarray(imageArray.astype(np.uint8))

    # Temporarily saving the image in /tmp folder.
    image.save(sys.argv[5])

    class InferenceConfig(CellConfig):
        GPU_COUNT = 1
        IMAGES_PER_GPU = 1
        IMAGE_RESIZE_MODE = "pad64"  # 'none' #
        DETECTION_MAX_INSTANCES = 3500  # 3000
        DETECTION_MIN_CONFIDENCE = 0.5
        DETECTION_NMS_THRESHOLD = 0.20
        RPN_ANCHOR_SCALES = (8, 16, 32, 64, 128)
        POST_NMS_ROIS_INFERENCE = 12000  # 15000

    inference_config = InferenceConfig()
    model = modellib.MaskRCNN(
        mode="inference",
        config=inference_config,
        model_dir=os.path.join(os.path.expanduser('~'), "logs"))

    model.load_weights(sys.argv[1], by_name=True)

    # Load back image.
    im = np.array(Image.open(sys.argv[5]))

    # Transform image to 3 channels.
    im = cv2.cvtColor(im, cv2.COLOR_GRAY2RGB)
    r = model.detect([im], verbose=1)[0]
    tmpArray = r['masks']

    # Traverses through array mapping where the individual cells are located.
    # End result is a 2-D array.
    arr2d = np.argmax(tmpArray, axis=-1)
    detections = arr2d
    my_set = {0}
    for i in range(len(detections)):
        for j in range(len(detections[0])):
            my_set.add(detections[i][j])

    num_nuclei = max(my_set)

    # get each nucleus' size and save the border into a list of points

    arr = detections.copy()

    nrows = len(arr)
    ncols = len(arr[0])

    sizes = []
    edges = []
    ids_detected = {0}-{0}  # set()

    edges = [[] for _ in range(num_nuclei)]
    NUCLEUS = 9999

    nuclei = []

    for r in range(nrows):
        for c in range(ncols):
            if arr[r][c] != 0 and arr[r][c] not in ids_detected:

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
    distance = numpy.zeros((len(detections), len(detections[0])), dtype=float)
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
    mask = numpy.ma.masked_equal(detections, 0)
    final_mask = numpy.where(detections == 0, ids_arr*(-1), ids_arr)
    final_mask = final_mask.astype('int16')
    img1 = Image.fromarray(final_mask)
    saveFile = os.path.join(os.path.expanduser(
        '~'), 'Documents', 'ZDFocus', 'tmp', sys.argv[6]+"_tmp_cyto.tif")

    img1.save(saveFile)
    array_2D = imread(saveFile)

    # Traverses through array mapping where the individual cells are located.
    # End result is a 2-D array.
    arr2d = np.argmax(array_2D, axis=-1)
    # Here is what is returned:
    # Image.fromarray(arr2d.astype(np.uint8)).save('sample out.png')
    if (sys.argv[7] == "Untitled Project"):
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', 'Detect Cytoplasm', sys.argv[6]+"_cyto_2D")
    else:
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', sys.argv[7], 'Detect Cytoplasm', sys.argv[6]+"_cyto_2D")

    with open(saveFile, 'wb') as fp:
        fp.write(arr2d.astype(np.uint32).tobytes())

    # Saving .png image:
    if (sys.argv[7] == "Untitled Project"):
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', 'Detect Cytoplasm', sys.argv[6]+"_cyto_2D_image.png")
    else:
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', sys.argv[7], 'Detect Cytoplasm', sys.argv[6]+"_cyto_2D_image.png")
    plt.imsave(saveFile, array_2D)

    # Saving .csv file:
    if (sys.argv[7] == "Untitled Project"):
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', 'Detect Cytoplasm', sys.argv[6]+"_cyto_info.csv")
    else:
        saveFile = os.path.join(os.path.expanduser(
            '~'), 'Documents', 'ZDFocus', sys.argv[7], 'Detect Cytoplasm', sys.argv[6]+"_cyto_info.csv")


    get_stats(image_path=sys.argv[8], annotation = [(0,0),(len(final_mask),0),(len(final_mask),len(final_mask[0])),(0,len(final_mask[0]))],
              mask=final_mask, csv_output_path=saveFile)
