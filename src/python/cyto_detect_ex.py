from cyto_detect import growing_assigner
import tifffile
import sys
import os
from os.path import exists
import json
import numpy as np

nuc_arr = sys.argv[1]
nuc_arr = np.fromstring(nuc_arr, dtype=int, sep=',')
nuc_arr.resize(int(sys.argv[7]), int(sys.argv[6]))
# print('Nucleus Array Shape', nuc_arr.shape)

tiff_path = sys.argv[2]
# print('Tiff Path', tiff_path)

channels = sys.argv[3]
if(channels != ''):
    channels_list = channels.split(",")
    for i in range(0, len(channels_list)):
        channels_list[i] = int(channels_list[i])
else:
    channels_list = list(range(1, 26))+[27, 29, 30, 31, 32]
# print(channels_list)
# print(type(channels_list))

names = sys.argv[4]
# print('Names', names)

# dict = json.loads(sys.argv[5])
# print(dict)
# print(type(dict))

# print('Width: ', sys.argv[6])
# print('Height: ', sys.argv[7])

# Instantiate the object whenever you need to use it
cyto_assigner = growing_assigner()


# MANDATORY PARAMETERS

# For nuclei mask, provide one of the following:
#   - nuc_file = path to tiff image containing nuc mask
#   - nuc_mask = 2D numpy array containig nuc mask

# For the channel img, provide one of the following:
#   - img_file = path to tiff image containing channels
#   - img = 3D numpy array containing the image

# OPTIONAL PARAMETERS
# channels = list of channels we will use (defaults to all channels)
# min_thresh = minimum value to consider not noise (default to 0.15)
# regularize = if should regularize (default true)
# standardize = if should standardize (default False)
# remap_nuc = If should remap the nuclei numbers so similar numbered
#               nuclei are not near one another. (default False)
# hide_loadbar = If we should hide the loading bar (default True)
#                   ( not relevant since I commented out tqdm)
# min_dist = minimum distance to default be assigned to nuclei (def 2)
# max_dist = maximum distance to be assigned (may be ignored if needed)
#               (default is to ignore this)
# early_term_radius = Lowest amount of radius we can terminate early
# min_thresh_k = Number of nearest neighbors to look at when settling
#               min_dist assignment disputes.  If less than k, we look at
#               all neighbors.  Default is 10.


# Based off our discussion, I am assuming you will have the 2D numpy array for
#   the nuclei mask and then a link to the img, along with a list of channels
nuc_mask = nuc_arr
img = tiff_path

# ^ It's okay to test without having list of channels, it defaults to
#       all channels, however these were the ones tristan recommended

# Now this will run the cyto assigner and return a 2D numpy array, where values
#   are either positive if representing a nuclei at that pixel, or the same
#   number but negative if it is cytoplasm assigned to that nuclei
cytoplasm_array = cyto_assigner.run(nuc_mask=nuc_mask,
                                    img_file=img,
                                    channels=channels_list)

# We can display the image if we have matplotlib installed
# cyto_assigner.display_img(cytoplasm_array)
# $ print(cytoplasm_array.shape)

# Or if we have plotly (probably dont)
# cyto_assigner.display_plotly(cytoplasm_array)

# If we have Pandas installed, we can quickly compile information
# To generate a data frame per pixel, we can pass the cytoplasm array and an
#       optional list of channel names to the fxn
#   cyto_assigner.get_data_per_pix(cytoplasm_array, channel_names=channel_names)

# Per pixel information is not as important though, we can get information about
#   mean, stdev, min, max, pixel count, etc using:
#   We need to pass the cytoplasm array, an optional list of channels, and which
#   aggregate functions we want to run.  Options are min, max, mean, std, and
#   count and by default it calculates them all.  We can then also pass
#   incl_cyto or incl_nuc (default to True) which determine whether we should
#   factor in pixels assigned to cyto / nuc for the nuclei aggregates
# df = cyto_assigner.get_data_per_nuc(cytoplasm_array, channel_names=channel_names,\
#                     agg_fxns=['mean', 'std'], incl_cyto=True, incl_nuc=True)

# I am going to run it without the channel names as I do not have those
df = cyto_assigner.get_data_per_nuc(cytoplasm_array, agg_fxns=['mean', 'std'])
# print(df)

saveFile = os.path.join(os.path.expanduser(
    '~'), 'Documents', 'ZDFocus', 'CSV Files')

if (exists(saveFile) != 1):
    os.mkdir(saveFile)
saveFile = os.path.join(saveFile, sys.argv[8]+"_cyto_info.csv")

df.to_csv(saveFile)

with open(sys.argv[9], 'wb') as fp:
    fp.write(cytoplasm_array.astype(np.uint32).tobytes())
print(cytoplasm_array.shape)
