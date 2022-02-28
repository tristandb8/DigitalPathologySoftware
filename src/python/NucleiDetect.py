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

if __name__ == '__main__':
    # These are the arguments that we have sent to the python scripts.
    # print('The Model path is: ', sys.argv[1])
    # print('The Image path is: ', sys.argv[2])

    # Set path to Mask RCNN folder
    ROOT_DIR = os.path.abspath(r"./")
    # Directory to save logs and trained model
    MODEL_DIR = os.path.join(ROOT_DIR, "logs")
    warnings.filterwarnings("ignore")
    # get_ipython().run_line_magic('matplotlib', 'inline')

    class InferenceConfig(CellConfig):
        GPU_COUNT = 1
        IMAGES_PER_GPU = 1
        IMAGE_RESIZE_MODE = "pad64"  # 'none' #
        DETECTION_MAX_INSTANCES = 3500  # 3000
        DETECTION_MIN_CONFIDENCE = 0.5
        DETECTION_NMS_THRESHOLD = 0.20
        # ROI_POSITIVE_RATIO = 0.8
        RPN_ANCHOR_SCALES = (8, 16, 32, 64, 128)
        # MEAN_PIXEL = np.array([40,15,30])

        POST_NMS_ROIS_INFERENCE = 12000  # 15000

    inference_config = InferenceConfig()
    model = modellib.MaskRCNN(mode="inference",
                              config=inference_config,
                              model_dir=MODEL_DIR)

    model.load_weights(sys.argv[1], by_name=True)

    # Load image
    im = imageio.imread(sys.argv[2])

    # Transform image to 3 channels
    im = cv2.cvtColor(im, cv2.COLOR_GRAY2RGB)

    r = model.detect([im], verbose=1)[0]

    # print('different things in data returned: ' + str(r.keys()))
    # print('You have ' + str(r['masks'].shape[2]) + ' nuclei detected')
    # print(r['masks'])

    # get first mask as image
    maskIndex = 0
    oneMask = Image.fromarray(r['masks'][:, :, maskIndex]).convert("1")

    ret = r['masks']

    # print(oneMask)
    # print(type(oneMask))
    # print(type(r['masks']))

    # print(oneMask)
    # asNumpyArray = numpy.array(oneMask)
    # asList = list(asNumpyArray)
    # print(json.dumps(asList))

    print(r['masks'])

    # new_image = Image.fromarray(np.array(json.loads(json_data), dtype='uint8'))

    ###################################################################################################################
    # this is what they used to plot all nuclei with colors and more

    # plt.figure(figsize=(20,10),dpi=100)
    # im = imageio.imread(image)
    # plt.subplot(1,2,1)
    # plt.imshow(im)
    # ax2=plt.subplot(1,2,2)
    # r=results = model.detect([im], verbose=1)[0]
    # visualize.display_instances_new(im, r['rois'], r['masks'], r['class_ids'], r['scores'], ax=ax2)
