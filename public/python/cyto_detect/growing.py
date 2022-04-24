# Samples using min_dist, pixels within min_dist will be assigned to that nuclei
#   if within multiple nuclei's min_dist, will determine based off the remaining
#   but will still be considered part of the nuclei's sample
# Assigns remaining


from .base_assigner import cyto_assigner_base
from .dist import dist_assigner
import numpy as np
import argparse
import random
from statistics import mode

#from tqdm import tqdm

''' Growing Parameters '''
# max_dist = maximum distance that will be reviewed that could be used,
#               default is whole image (no max)
# min_dist = minimum distance that should be assigned around a nuclei without
#               looking at similarity.  Default is 2.
# early_term_radius = smallest radius we can terminate early with.  Default is 8
#       smaller early_term_radius may not allow proper evaluation, too large
#       will create too large of cytoplasm
# min_thresh_k = max number of neighbors to look at when breaking ties created
#       by min_dist

class growing_assigner(cyto_assigner_base):

    __slots__ = ('min_dist', 'max_dist', 'early_term_radius', 'min_thresh_k')

    def __init__(self, **params):
        super().__init__(**params)

    def _setup(self, **params):
        super()._setup(**params)

        self.min_dist, self.max_dist = params.get('min_dist',2), \
                       params.get('max_dist',max(self.shape[0],self.shape[1]))

        self.early_term_radius = params.get('early_term_radius', 8)

        self.min_thresh_k = params.get('min_thresh_k', 10)

    def run(self, **params):
        # Run setup, extract parameters
        self._setup(**params)

        # If supplied channels and the length of the channels list is 0, resort
        #   to utilizing distance based approach
        if params.get('channels') is not None and \
                                        len(params.get('channels')) == 0:
            return dist_assigner().run(**params)

        # Generate 2D list for cytoplasm
        cyto = self.gen_2d_list()
        # Get min dist / max dist / min_k in local scope
        min_dist, max_dist = \
            params.get('min_dist',self.min_dist), params.get('max_dist',self.max_dist)
        min_thresh_k = params.get('min_thresh_k', self.min_thresh_k)
        # Convert nuc_mask to 2d list
        nuc_mask = [[int(v) for v in row] for row in self.nuc_mask]
        # Get shape in local scope
        shape, rel_tpls = self.shape, self.rel_tpls
        # Cell Dct contains list of points assigned during min_thresh
        cell_dct = {}
        # Move the dimensions of img so it is [z][x][y] -> [x][y][z]
        img = np.moveaxis(self.img, 0, -1)

        # Generate relative points
        rel_pts = set()
        for r in range(self.min_dist):
            rel_pts.update(self._gen_circle_outline(r))

        # For each pixel that represents a nuclei, find all points surrounding
        #   and assign them to that nuclei
        '''
        for x, y in tqdm({(x,y) for x,y in self.xy if nuc_mask[x][y] != 0}, \
                        desc='Assigning pixels in min_dist',unit='pix',\
                        disable=self.hide_loadbar):
        '''
        for x, y in {(x,y) for x,y in self.xy if nuc_mask[x][y] != 0}:

            # Assign this pixel as nuclei number "nuc"
            nuc = abs(int(nuc_mask[x][y]))
            cyto[x][y] = nuc

            # Add this to the cell dictionary
            cell_dct.setdefault(abs(nuc), set()).add((x,y))

            # Iterate through surrounding relative points that are cytoplasm
            for tx,ty in {(x+rx,y+ry) for rx,ry,d in rel_pts \
                            if ((x+rx >= 0 and x+rx < shape[0] and \
                                 y+ry >= 0 and y+ry < shape[1]) and \
                                 nuc_mask[x+rx][y+ry] == 0)}:
                # Add this pixel coords to the cell dictionary
                cell_dct.setdefault(abs(nuc), set()).add((tx,ty))
                # Assign the pixel in the cyto list
                if cyto[tx][ty] is None:
                    # If None, nothing is currently assigned, assign this
                    cyto[tx][ty] = -nuc
                elif isinstance(cyto[tx][ty], int):
                    # If int, something is already assigned
                    if cyto[tx][ty] == 0:
                        # 0 is same as None for our purposes
                        cyto[tx][ty] = -nuc
                    elif abs(cyto[tx][ty]) != abs(nuc):
                        # Create set containing both values
                        cyto[tx][ty] = set((cyto[tx][ty], -nuc))
                elif isinstance(cyto[tx][ty], set):
                    # If already a set, add this one
                    cyto[tx][ty].add(-nuc)
                else:
                    raise Exception

        # Removes sets by comparing each pixel that is assigned to multiple nucs
        #   to all the pixels within the min_thresh distance of the each nuc
        #   it has in the set, then determines which it is the most similar to
        '''
        for x,y in tqdm({(x,y) for x,y in self.xy if isinstance(cyto[x][y], set)},\
                        desc='Deciding between overlapping mindist',unit='pix',\
                        disable=self.hide_loadbar):
        '''
        for x,y in {(x,y) for x,y in self.xy if isinstance(cyto[x][y], set)}:
            # Returns euclidean distance between two pixels' channels
            def tag_sim_key(item):
                # Handles if errors pass
                if item is None:
                    return len(img)
                (x3, y3), _ = item
                # Returns euclidean distance between tags
                return np.linalg.norm(img[x][y] - img[x3][y3])
            # Get the nuc options at this spot
            nuc_opts = cyto[x][y]
            # Create a set of all pixels assigned to any of the nuclei that we
            #   may assign this pixel to.
            similarity = set()
            for nuc in nuc_opts:
                try:
                    similarity.update([(pt, nuc) for pt in cell_dct[abs(nuc)] \
                                        if isinstance(cyto[pt[0]][pt[1]],int)])
                except:
                    print(f'Error for pixel ({x},{y}) with cell {abs(nuc)}')
            # If similarity is larger than min_thresh_k, sort and shrink list
            if len(similarity) > min_thresh_k:
                # Sort all these pixels by euclidean distance to our pixel
                similarity = \
                        sorted(similarity,key=tag_sim_key)[:self.min_thresh_k]
            else: # Otherwise just convert to list
                similarity = list(similarity)

            # If nothing is similar, skip, will be fixed in _fix_lonely_pixels,
            #   and should not happen.
            if len(similarity) == 0:
                cyto[x][y] = None
                continue
            # Turn the list of coords into respective nuclei
            nucs = []
            for item in similarity:
                if isinstance(item, set):
                    nucs.extend([abs(nuc) for x,y,nuc in item])
                elif isinstance(item[1], int):
                    nucs.append(abs(item[1]))
                else:
                    raise TypeError

            # Try to take the mode, otherwise pick one at random
            try:
                cyto[x][y] = -mode(nucs)
            except:
                cyto[x][y] = -random.choice(nucs)

        # Find the centers of the nuclei
        centers = self._find_centers()

        # Get the max distance
        max_dist = max_dist if max_dist is not None and max_dist > 0 \
                                                    else max(shape[0],shape[1])
        # Iterate through radius for assignment
        '''
        for radius in tqdm(range(1,max(shape[0],shape[1])),\
                desc='Growing radius around nuclei centers',unit='pix-radius',\
                disable=self.hide_loadbar):
        '''
        for radius in range(1,max(shape[0],shape[1])):
            # Tracker for how many pixels are changed
            changed_pix = 0
            # Generate relative poitns of radius size
            rel_pts = self._gen_circle_outline(radius)
            # Iterate through different nuclei (random order)
            for nuc, center in random.sample(centers.items(),len(centers)):
                # Get center cords
                cx,cy = center
                # Iter through all points of radius distance from center point
                for x,y in {(cx+rx,cy+ry) for rx,ry,d in rel_pts \
                                if cx+rx >= 0 and cx+rx < shape[0] and \
                                   cy+ry >= 0 and cy+ry < shape[1] and \
                                   nuc_mask[cx+rx][cy+ry] == 0}:
                    # Find surrounding points of this pixel
                    sur_pts = [(x+rx, y+ry) for rx,ry in rel_tpls \
                                    if x+rx >= 0 and x+rx < shape[0] and \
                                       y+ry >= 0 and y+ry < shape[1]]
                    # Find surrounding nuclei assignment fore this pixel
                    sur_nuc = [abs(cyto[tx][ty]) for tx,ty in sur_pts \
                                    if cyto[tx][ty] is not None and \
                                       cyto[tx][ty] != 0]

                    # If this nuclei is not in the surrounding, use mode of
                    #       surrounding

                    if abs(nuc) not in sur_nuc:
                        try:
                            cyto[x][y] = -mode(sur_nuc)
                        except:
                            cyto[x][y] = -random.choice(sur_nuc)

                    def tag_sim_key(item):
                        # Handles if errors pass
                        if item is None:
                            return len(img)
                        x3, y3 = item
                        # Returns euclidean distance between tags
                        return np.linalg.norm(img[x][y] - img[x3][y3])

                    sorted_pts = sorted([pt for pt in sur_pts \
                                        if (cyto[pt[0]][pt[1]] is not None and \
                                            cyto[pt[0]][pt[1]] != 0)], \
                                        key=tag_sim_key)
                    # Skip if no surrounding points
                    if len(sorted_pts) == 0:
                        continue

                    if nuc is None or nuc == 0:
                        continue
                    elif nuc == abs(cyto[sorted_pts[0][0]][sorted_pts[0][1]]):
                        cyto[x][y] = -nuc
                        changed_pix += 1
            # Go through and try to assign remaining points based off mode
            for x,y in {(x,y) for x,y in self.xy \
                                    if cyto[x][y] is None or cyto[x][y] == 0}:

                sur_pts = [(x+rx, y+ry) for rx,ry in rel_tpls \
                                if x+rx >= 0 and x+rx < shape[0] and \
                                   y+ry >= 0 and y+ry < shape[1]]

                sur_nuc = [abs(cyto[tx][ty]) for tx,ty in sur_pts \
                                if cyto[tx][ty] is not None and \
                                   cyto[tx][ty] != 0]
                if len(sur_nuc) == 0:
                    continue
                else:
                    try:
                        cyto[x][y] = -mode(sur_nuc)
                    except:
                        cyto[x][y] = -random.choice(sur_nuc)

            # Check early termination radius and if all pixels are assigned
            if (radius > min(max_dist, self.early_term_radius)) and \
                                    all([cyto[x][y] is not None and \
                                        cyto[x][y] != 0 for x,y in self.xy]):
                # If above early term radius and all pixels are assigned break
                break

        return np.array(self._fix_lonely_pixels(cyto))
