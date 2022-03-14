from mrcnn.main import *
from mrcnn.utils import *
from mrcnn.config import Config
from PIL import Image
import numpy
import warnings
from IPython import get_ipython
import cv2
import sys
import json
from json import JSONEncoder
import tifffile
numpy.set_printoptions(threshold=sys.maxsize)


class NumpyArrayEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return JSONEncoder.default(self, obj)


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
    im = imageio.imread(sys.argv[5])

    # Transform image to 3 channels.
    im = cv2.cvtColor(im, cv2.COLOR_GRAY2RGB)
    r = model.detect([im], verbose=1)[0]
    tmpArray = r['masks']

    # Traverses through array mapping where the individual cells are located.
    # End result is a 2-D array.
    x, y, z = tmpArray.shape
    arr2d = np.zeros([x, y])
    for a in range(x):
        for b in range(y):
            for c in range(z):
                if tmpArray[a][b][c] != 0:
                    arr2d[a][b] = c

    # Here is what is returned:
    stringArray = np.array2string(
        arr2d, precision=4, separator=',', suppress_small=True)
    saveFile = os.path.join(os.path.expanduser(
        '~'), 'Documents', 'DPSoftware', sys.argv[6]+"_2D.json")
    # dict = {
    #     "Dimensions": arr2d.shape,
    #     "Array": stringArray
    # }

    with open(saveFile, 'w') as fp:
        json.dump(arr2d, fp, cls=NumpyArrayEncoder)
    # print(arr2d.shape)
    # print(arr2d)
    # array3Dshape = [x, y, z]
    # print(array3Dshape)
    # print(tmpArray)

    # ------------------ Create 1 .png image ------------------
    # maskIndex = 0
    # oneMask = (r['masks'][:, :, maskIndex])
    # for x in range(r['masks'].shape[2]):
    #     oneMask = np.logical_or(oneMask, r['masks'][:, :, x])
    #     arr2d =
    # print(oneMask)

    # NEED TO REMOVE THE EXTRA PLOT INFO
    # plt.imshow(oneMask)
    # plt.savefig('allCells.png')

    # # get first mask as image
    # maskIndex = 0
    # oneMask = (r['masks'][:, :, maskIndex])
    # for x in range(r['masks'].shape[2]):
    #     oneMask = np.logical_or(oneMask, r['masks'][:, :, x])
    # print(oneMask)
    # ret = r['masks']
    # numpyData = {"Cells Found": ret}
    # encodedNumpyData = json.dumps(numpyData, cls=NumpyArrayEncoder)
    # print(encodedNumpyData)

    ###################################################################################################################
    # this is what they used to plot all nuclei with colors and more

    # plt.figure(figsize=(20,10),dpi=100)
    # im = imageio.imread(image)
    # plt.subplot(1,2,1)
    # plt.imshow(im)
    # ax2=plt.subplot(1,2,2)
    # r=results = model.detect([im], verbose=1)[0]
    # visualize.display_instances_new(im, r['rois'], r['masks'], r['class_ids'], r['scores'], ax=ax2)
