# Assigns to closeset, ties are broken with mode if possible, otherwise randomly

from .base_assigner import cyto_assigner_base
import numpy as np
import random
from statistics import mode
#from tqdm import tqdm

''' Dist Parameters '''
# max_dist = maximum distance that will be reviewed that could be used,
#               default is whole image (no max)

class dist_assigner(cyto_assigner_base):

    def run(self, **params):
        # Runs setup (deals with params)
        self._setup(**params)
        # Create a 2D list for cytoplasm
        cyto = self.gen_2d_list()
        # Get minimum and max distance
        max_dist = params.get('max_dist',max(self.shape[0], self.shape[1]))
        # Get nuc_mask info
        nuc_mask, shape = self.nuc_mask, self.shape
        # Create a dictionary to store relative points
        #       (radius -> set of rel coords)
        rel_pts = dict()

        # Iterate through all pixels
        '''
        for x,y in tqdm(self.xy, disable=self.hide_loadbar, \
                        desc='Assigning pixels to closest nuc',unit='pix'):
        '''
        for x,y in self.xy:

            # If a nuclei, place in cytoplasm 2D list
            if nuc_mask[x][y] != 0:
                cyto[x][y] = int(nuc_mask[x][y])
                continue

            # Iterate through radius
            for r in range(0, max_dist):
                # Either get or calculate relative points of r radius
                if r in rel_pts:
                    cur_rel_pts = rel_pts.get(r)
                else:
                    cur_rel_pts = rel_pts.setdefault(r, \
                                                    self._gen_circle_outline(r))
                # Look into surrounding nuclei
                sur_nuc = [int(nuc_mask[x+rx][y+ry]) for rx,ry,d in cur_rel_pts \
                                    if x+rx >= 0 and x+rx < shape[0] and \
                                       y+ry >= 0 and y+ry < shape[1] and \
                                       nuc_mask[x+rx][y+ry] != 0]

                if len(sur_nuc) == 0:
                    # Skip if nothing nearby
                    continue
                elif len(sur_nuc) == 1:
                    # If only one, get value
                    cyto[x][y] = -sur_nuc[0]
                else:
                    try:
                        # If surrounding has multiple try to find mode
                        cyto[x][y] = -mode(sur_nuc)
                    except:
                        # If failed, do random choice
                        cyto[x][y] = -random.choice(sur_nuc)\
                # Break (at this point it should be assigned)
                break
            # Raise error if failed to find a nuclei
            if cyto[x][y] is None or cyto[x][y] == 0:
                raise Exception('Failed to find a Nuclei')

        # Return as numpy array, fix lonely pixels first
        return np.array(self._fix_lonely_pixels(cyto))
