from email.mime import image
import math
import cv2
import numpy as np
import matplotlib.pyplot as plt
import sys
import json
from PIL import Image

args = json.load(open(sys.argv[1], 'r'))
detections = np.asarray(args)


class Nucleus(object):
    def __init__(self, size, edges, id):
        self.size = size
        self.edges = edges
        self.id = id
        # calculate center

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
edges = []
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
final_mask = np.where(detections == 0, ids_arr*-1, ids_arr)


# Final mask is what you want, each cyto value is negative,
# the nucleus is positive
plt.imshow(final_mask)
