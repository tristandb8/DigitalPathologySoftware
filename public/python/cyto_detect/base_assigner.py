import tifffile, sys, math, random, os
import numpy as np
from copy import deepcopy
from statistics import mode
#from tqdm import tqdm

# Optional imports
try:
    from matplotlib import pyplot as plt
except:
    pass

try:
    import plotly.graph_objects as go
    import plotly.express as px
except:
    pass

try:
    import pandas as pd
except:
    pass

class cyto_assigner_base():

    __slots__ = ('img', 'channels', 'n_nuc', \
                 'shape', 'nuc_mask', 'xy',\
                 'min_thresh', 'original_img',\
                 'hide_loadbar')

    # Relative tuples, used for iterating around pixels
    rel_tpls = ((0,1),(1,0),(-1,0),(0,-1))

    ''' Setup '''

    # _setup
    #   Sets up the cyto assigner
    #   Input:
    #       - params dictionary  (param names -> param values)
    #   Exceptions:
    #       - Passed nonstring for file paths = TypeError
    #       - Passed nonvalid file path = ValueError
    #       - Incorrect number of dimensions = ValueError
    #       - Did not provide n_mask = Exception
    #       - n_mask doesn't match img = ValueError
    def _setup(self, **params):

        # Loads the nuc_mask
        if 'nuc_mask' in params or 'nuc_file' in params:
            if 'nuc_mask' in params:
                # If provided 'nuc_mask', we will just grab that mask
                self.nuc_mask = params['nuc_mask']
            else:
                # If provided 'nuc_file', we will load in the file
                nuc_file = params.get('nuc_file')
                # Verify string
                if not isinstance(nuc_file, str):
                    raise TypeError('Expected string for nuc_file')
                # Verify valid path
                if not os.path.exists(nuc_file):
                    raise ValueError('Invalid nuc_file path')
                # Load in the nuc mask
                self.nuc_mask = self._load_nuc_mask(params['nuc_file'])
            # Verify numpy array
            if not isinstance(self.nuc_mask, np.ndarray):
                raise TypeError('Expected numpy ndarray for nuc_mask')
            if self.nuc_mask.ndim != 2:
                raise ValueError('Expected 2D numpy ndarray for nuc_mask')
        else:
            raise Exception('Need to provide nuc_mask or nuc_file')

        # Get information from the nuc_mask
        self.n_nuc, self.shape = self.nuc_mask.max(), self.nuc_mask.shape

        # Sees if given specific channels
        self.channels = params.get('channels')

        # Load in tiff image with channels
        if 'img' in params or 'img_file' in params:
            # Either get the img from params or load the image
            if 'img' in params:
                self.img = params['img']
            else:
                img_file = params['img_file']
                # Verify img_file is a string
                if not isinstance(img_file, str):
                    raise TypeError('img_file should be a str')
                # Verify valid path
                if not os.path.exists(img_file):
                    raise ValueError('Invalid img_file path')
                # Load the image
                self.img = self._load_img(params['img_file'])
            # Verify ndarray
            if not isinstance(self.img, np.ndarray):
                raise TypeError('Expected image')
            # Verify 3 dimensional
            if (self.img.ndim != 3):
                raise ValueError('Expected 3D image for img')
            # Verify shape matches nuc_mask
            if self.img.shape[1] != self.nuc_mask.shape[0] or \
                            self.img.shape[2] != self.nuc_mask.shape[1]:
                raise ValueError('Shape of img does not match nuc_mask')
            # Copy image so we have the original
            self.original_img = self.img.copy()
            # Apply filter
            self._filter_channels()
        else:
            # Just set to None if not needed (img not needed for all methods)
            self.img = None

        # min_thresh, anything below this value will be zeroed
        self.min_thresh = params.get('min_thresh', 0.15)
        if self.min_thresh != 0:
            self._apply_min_thresh(self.img, thresh=self.min_thresh)

        # Regularizes the data
        if params.get('regularize', True):
            self._apply_regularization()

        # Standardizes the data (Not recommended by Tristan)
        if params.get('standardize', False):
            self._apply_standardization()

        # If remapping the nuclei, remap so its easier to read
        if self.nuc_mask is not None and params.get('remap_nuc', False):
            self.nuc_mask = self._remap_nuclei(self.nuc_mask)

        # Whether to hide the TQDM bars
        self.hide_loadbar = params.get('hide_loadbar', True)

        # Get all x,y coordinate combos
        self.xy = set()
        for x in range(self.shape[0]):
            self.xy.update({(x,y) for y in range(self.shape[1])})
    # End of _setup


    ''' Loading '''

    # _load_nuc_mask
    #   - Loads the nuclei mask
    #   Input:
    #       - file_loc = A string containing a path to a tiff file containing
    #               the tiff image
    #   Output:
    #       - img = 2D numpy array containing the nuclei mask
    #   Exceptions:
    #       - Invalid path = ValueError
    #       - Invalid Type = TypeError
    def _load_nuc_mask(self, file_loc):
        try:
            return self._load_tiff(file_loc)
        except ValueError as e:
            raise Exception('Nucleus Mask location string was not valid') from e
        except TypeError as e:
            raise Exception('Expected Nucleus Mask parameter as a string of' +\
                            ' nucleus mask location') from e
    # End of _load_nuc_mask

    # _load_img
    #   - Loads the tifffile image containing channels
    #   Input:
    #       - file_loc = A string containing a path to a tiff file containing
    #               the tiff image
    #   Output:
    #       - img = 2D numpy array containing the tiff image
    #   Exceptions:
    #       - Invalid path = ValueError
    #       - Invalid Type = TypeError
    def _load_img(self, file_loc, regularize=True, min_thresh=0):
        try:
            img = self._load_tiff(file_loc)
            if self.channels is None:
                self.chanenls = range(len(img))
            return img
        except ValueError as e:
            raise Exception('Tifffile image location string was not valid') from e
        except TypeError as e:
            raise Exception('Tifffile image location should be a string object')
    # End of _load_img

    # _load_tiff
    #   - Loads a tifffile image
    #   Input:
    #       - file_loc = A string containing a path to a tiff file containing
    #               a tiff image
    #   Output:
    #       - img = 2D numpy array containing the tiff image
    #   Exceptions:
    #       - Invalid path = ValueError
    #       - Invalid Type = TypeError
    @staticmethod
    def _load_tiff(file_loc):
        # Raise error if not passed a string
        if not isinstance(file_loc, str):
            raise TypeError('Expected a string for file_loc')
        # If not a valid file location raise Value Error
        if not os.path.isfile(file_loc):
            raise ValueError(f'{file_loc} is not a valid file location')
        # Read the file
        return tifffile.imread(file_loc)
    # End of _load_tiff

    ''' Image Processing '''
    # _filter_channels
    #   - Removes channels not assigned
    #   Input:
    #       - img = the tifffile img containing the channels
    #   Output:
    #       - img = the tifffile img following removing the channels
    #   Exceptions:
    #       - Channel to remove was out of bounds = IndexError
    def _filter_channels(self):
        img = self.img
        if img is None:
            raise Exception('Missing self.img')
        if self.channels is None:
            # If no channels provided, set it to all channels then return
            self.channels = range(len(img))
            return
        elif max(self.channels) > len(img):
            # Raise an error if channel is above max number of channels
            raise IndexError('Channel to remove was out of bounds')
        elif min(self.channels) < 0:
            # Raise an error if the channel is negative (cannot have negatives)
            raise IndexError('Cannot have negative channels')
        # Find all channels we should delete
        to_delete = [c for c in range(len(img)) if c not in self.channels]
        # If there are any we should delete, delete them
        if len(to_delete) > 0:
            img = np.delete(img, to_delete, axis=0)
        # Return the image following the deletion (if occured)
        return img
    # End of _filter_channels

    # _apply_standardization
    #   - Apply standardization to the images' channels
    #   Input:
    #       - img = the tifffile img containing the channels
    #   Output:
    #       - img = the tifffile img standardized
    def _apply_standardization(self):
        img = self.img
        if img is None:
            raise Exception('Missing self.img')
        for z in range(len(img)):
            img[z] = (img[z] - np.mean(img[z])) / (np.std(img[z]))
        return img
    # End of _apply_standardization


    # _apply_regularization
    #   - Apply standardization to the images' channels
    #   Input:
    #       - img = the tifffile img containing the channels
    #   Output:
    #       - img = the tifffile img standardized
    def _apply_regularization(self):
        img = self.img
        if img is None:
            raise Exception('Missing self.img')
        for z in range(len(img)):
            img[z] = (img[z] - np.mean(img[z])) / (np.std(img[z]))
        return img
    # End of _apply_regularization

    # _apply_min_thresh
    #   - Apply a minmum threshold to cut out
    #   Input:
    #       - img = the tifffile img containing the channels
    #       - thresh (default:0) = the minimum absolute value where we do not
    #                              zero out the value (to reduce noise)
    #       - remove_empty_channels = boolean whether to remove channels that
    #                                 are now empty
    #   Output:
    #       - img = the tifffile img containing the channels with thresh applied
    def _apply_min_thresh(self, img, thresh=0, remove_empty_channels=False):
        # If thresh == 0, just return the img (no thresh is set)
        if thresh == 0:
            return img
        # Apply the minimum threshold
        for z in range(len(img)):
            img[z][img[z]<thresh] = 0

        # Removes empty channels
        if remove_empty_channels:
            remove_ch = [z for z in range(len(img)) if np.all(img[z] == 0)]
            img = np.delete(img, remove_ch, axis=0)

        return img
    # End of _apply_min_thresh

    # _remap_nuclei
    #   - Remaps the nuclei so that they are not right next to each other which
    #       makes the nuclei easier to visualize
    #   Input:
    #       - n_mask = the nuclei mask
    #   Output:
    #       - n_mask = nuclei mask remapped
    @staticmethod
    def _remap_nuclei(n_mask):
        # Get values about n_mask
        shape, n_nuc = n_mask.shape, n_mask.max()
        # Create a new matrix
        new_nuclei = np.empty(shape, dtype=np.int32)
        # Create random mapping
        mapping = list((range(1,n_nuc+1)))
        random.shuffle(mapping)
        mapping = [0] + mapping
        # Reassign values of the nuclei mask
        for nucnum in range(n_nuc+1):
            new_nuclei[n_mask == nucnum] = mapping[nucnum]
        return np.array(new_nuclei)
    # End of _remap_nuclei

    ''' Post Repair '''
    # _fix_lonely_pixels
    #   Replaces pixels which are assigned to nuclei that they do not touch with
    #       alternatives that do touch.  Ensures continuous cytoplasm
    #   Input:
    #       - cyto = 2D list containing positive values for position of nuclei
    #                   and equivalent negative values for cytoplasm assigned
    #                   to said nuclei
    #   Output:
    #       - cyto = Same as input cyto, just repaired.
    def _fix_lonely_pixels(self, cyto):
        # Get
        rel_tpls, shape = self.rel_tpls, self.shape
        # Create a 2D list containing values of nuclei at each x,y coordinate
        touching = [[cyto[x][y] if (cyto[x][y] is not None and cyto[x][y] > 0) \
                else None for y in range(shape[1])] for x in range(shape[0])]

        # Iterate through all pixels that are assigned in touching list
        '''
        for x,y in tqdm({(x,y) for x,y in self.xy if touching[x][y] is not None}, \
                        desc='Checking to see if pix are touching',unit='pix',\
                        disable=self.hide_loadbar):
        '''
        for x,y in {(x,y) for x,y in self.xy if touching[x][y] is not None}:

            # Recursive call, determines if a cyto pixel touches the nuclei
            #   that it is assigned to
            #   Input:
            #       - x2 = x coord, y2 = y coord
            def place_around(x2,y2):
                # Get the nucleus at this point
                nuc = cyto[x2][y2]
                # Set to track all points we visited
                visited = set()
                # Recursive call
                #   Input:
                #       - x3, y3 = coords
                #       - r_ct = recursive count (how many recursive calls deep)
                def _place_around(x3,y3,r_ct=0):
                    # Add that we visited this point
                    visited.add((x3,y3))
                    # Place that we touch around
                    touching[x3][y3] = abs(nuc)
                    # Return if above recursive call count
                    if r_ct >= 950:
                        return
                    # Iterate around if
                    for x4,y4 in [(x3+rx,y3+ry) for rx,ry in self.rel_tpls \
                                    if x3+rx >= 0 and x3+rx < shape[0] and \
                                       y3+ry >= 0 and y3+ry < shape[1] and \
                                       cyto[x3+rx][y3+ry] is not None and \
                                       abs(cyto[x3+rx][y3+ry]) == abs(nuc) and\
                                       touching[x3+rx][y3+ry] is None]:
                        # Skip if already seen
                        if (x4,y4) in visited:
                            continue
                        # Try to call this for this point
                        try:
                            _place_around(x4,y4, r_ct=r_ct+1)
                        except RecursionError:
                            # Shouldn't happen anymore, but if so, try to return
                            #   and not crash.
                            return

                try:
                    _place_around(x2,y2)
                except RecursionError:
                    return
            place_around(x,y)

        # Determine bad values that are not "touching"
        bad_pix = {(x,y) for x,y in self.xy if touching[x][y] is None}
        attempt = 0 # Track number of attempts
        while(len(bad_pix) > 0): # While still having bad pixs
            attempt += 1 # incr. attempt tracker
            # Iterate through bad pixels
            '''
            for x,y in tqdm(bad_pix, disable=self.hide_loadbar, desc=\
                        f'Fixing lonely pixs (Attempt {attempt})',unit='pix'):
            '''
            for x,y in bad_pix:
                # Get list of surrounding pixels we know are touching their
                #   respective nuclei
                sur_tch = [touching[x+rx][y+ry] for rx, ry in rel_tpls \
                                if x+rx >= 0 and x+rx < shape[0] and \
                                   y+ry >= 0 and y+ry < shape[1] and \
                                   touching[x+rx][y+ry] is not None]
                # If none of the surrounding pixels are touching, skip and
                #   come back later
                if len(sur_tch) == 0:
                    continue
                elif len(sur_tch) == 1:
                    # Unpack the only surrounding pixel we know is touching
                    #   its assigned nuclei and assign it at this point
                    touching[x][y] = abs(sur_tch[0])
                    cyto[x][y] = -abs(sur_tch[0])
                else:
                    try:
                        # Attempt to take the mode, may cause exception if
                        #   multiple modes exist ex: (2,2,4,4)
                        touching[x][y] = abs(mode(sur_tch))
                    except:
                        # If failed at taking the most commonly occuring, pick
                        #   one at random
                        touching[x][y] = abs(random.choice(sur_tch))
                    # Assign to cyto
                    cyto[x][y] = -(touching[x][y])
            # Reevaluate bad pixels
            bad_pix = {(x,y)for x,y in self.xy if touching[x][y] is None}
        return cyto

    ''' Utility '''
    # _gen_circle_outline
    #   - Uses the midpt formula to generate all points of a circle centered
    #       at 0,0.  Can be used to find circular relative points around a
    #       a certain point
    def _gen_circle_outline(self, r):
        # Default variables
        x,y,P = r, 0, 1 - r
        # Pts directly above, below, left, and right
        pts = [(x,0,x), (-x,0,x), (0,x,x), (0,-x,x)]
        # Figure out diagnols (MidPt Alg)
        while x > y:
            y += 1
            if P <= 0:
                P = P + 2 * y + 1
            else:
                x -= 1
                P = P + 2 * y - 2 * x + 1
            # Terminate once x < y
            if (x < y):
                break
            # Calculates the distance
            dist = math.sqrt((x*x)+(y*y))
            # Add the points
            pts.extend(((x,y,dist),(-x,y,dist),(x,-y,dist),(-x,-y,dist)))
            # Add more
            if x != y:
                pts.extend(((y,x,dist),(-y,x,dist),(y,-x,dist),(-y,-x,dist)))
        return pts
    # End of _gen_circle_outline

    # gen_2d_list
    #   - Generates a 2D list
    #   Inputs:
    #       - val (default:None)= the value that is placed by default
    #       - shape = shape of @d list, defaults to self.shape
    #   Outputs:
    #       - a 2D list containing value "val" of provided shape
    def gen_2d_list(self, val=None, shape=None):
        if shape is None:
            shape = self.shape
            if shape is None:
                raise ValueError('No shape given')
        return [[val for y in range(shape[1])] for x in range(shape[0])]
    # End of gen_2d_list

    # _find_centers
    #   Returns centers of the Nuclei
    #   Output:
    #       - dictionary containing centers of nuclei (nuc_num -> center coords)
    def _find_centers(self):
        # Get needed values in our local scope
        nuc_mask, nuc_pts, center, rel_tpls = \
                self.nuc_mask, {}, {}, self.rel_tpls
        # Iterate through pixels
        for x,y in self.xy:
            # Skip if not nuclei
            if nuc_mask[x][y] == 0:
                continue
            # Add the current coordinates to the nuclei
            nuc_pts.setdefault(int(nuc_mask[x][y]), set()).add((x,y))
        # Per nuclei, determine a center
        for nuc, pts in nuc_pts.items():
            # Sum x and y coords
            xsum, ysum = 0,0
            for x,y in pts:
                xsum += x
                ysum += y
            # Create a point based off mean
            c_pt = (round(xsum/len(pts)), round(ysum/len(pts)))
            # If this point is not this nuclei, search around and look
            #   in relative points
            if nuc_mask[c_pt[0]][c_pt[1]] != nuc:
                for rx, ry in rel_tpls:
                    if nuc_mask[c_pt[0]+rx][c_pt[1]+ry] == nuc:
                        center[nuc] = (c_pt[0]+rx, c_pt[1]+ry)
            else: # If we still cannot find it, just use mean value
                center[nuc] = c_pt

        return center

    ''' Display / Export '''
    @staticmethod
    def display_img(img, cmap='viridis'):
        plt.imshow(img, cmap=cmap)
        plt.colorbar()
        plt.tight_layout()
        plt.show()
        # End of display_img

    # Plotly express
    @staticmethod
    def display_plotly(img):
        px.imshow(img)

    # get_data_per_pix
    #   Returns information per pixel
    #   Input:
    #       - cyto = 2D list of cyto assignment
    #       - channel_names (optional) = list of channel names where indices
    #           line up with the channels in the tiff image
    def get_data_per_pix(self, cyto, channel_names=None):
        # Move axis so that the [z][x][y] dims is [x][y][z]
        img = np.moveaxis(self.original_img,0,-1)
        # Create dictionary to store information
        dct = {}
        # Iterate through each pixel and get info
        for x,y in self.xy:
            dct.setdefault('x',[]).append(x)    # Stores x cord
            dct.setdefault('y',[]).append(y)    # Stores y cord
            dct.setdefault('nuc',[]).append(abs(cyto[x][y])) # Stores assigned nuc
            dct.setdefault('is_cyto',[]).append((cyto[x][y] < 0)) # if cyto
            dct.setdefault('is_nuc',[]).append((cyto[x][y] > 0)) # if is nuclei

            # If given channel names and they do not match lens raise Error
            if channel_names is not None and len(channel_names) != len(img[x][y]):
                raise ValueError('Not the same amount of channel names for channels')

            # Add the channel values
            if channel_names is None:
                # If not provided channel names, use channel numbers
                for channel, val in enumerate(img[x][y]):
                    dct.setdefault(channel,[]).append(val)
            else:
                # If given channel names, use those instead
                for channel, val in enumerate(img[x][y]):
                    dct.setdefault(channel_names[channel],[]).append(val)
        # Return a Pandas dataframe
        return pd.DataFrame(dct)

    # get_data_per_pix
    #   Returns information per nuclei
    #   Input:
    #       - cyto = 2D list of cyto assignment
    #       - channel_names (optional) = list of channel names where indices
    #           line up with the channels in the tiff image
    #       - agg_fxns (optional) = list of aggregate functions
    def get_data_per_nuc(self, cyto, channel_names=None, incl_nuc=True, \
                                                incl_cyto=True, agg_fxns=None):

        if agg_fxns is None:
            # If no values passed, use all agg fxns
            agg_fxns = ['min','max','mean','std','count']
        elif isinstance(agg_fxns, str):
            # If only passed a string, wrap in a list
            agg_fxns = [agg_fxns]

        # Get informatoin per pixel
        df = self.get_data_per_pix(cyto, channel_names=channel_names)
        if not incl_cyto and not incl_nuc:
            raise ValueError('Need to include cyto or nuc')
        elif not incl_cyto:
            df = df[df.is_cyto == False]
        elif not incl_nuc:
            df = df[df.is_nuc == False]

        # Groupby the nuclei and then apply aggregate functions
        return df.groupby('nuc').agg(agg_fxns)
