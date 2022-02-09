from mrcnn.main import *
from mrcnn.utils import *
# Set path to Mask RCNN folder
ROOT_DIR = os.path.abspath(r"C:\Users\tr248228\Documents\NucleiDetectFolder")
# Directory to save logs and trained model
MODEL_DIR = os.path.join(ROOT_DIR, "logs")
import warnings
warnings.filterwarnings("ignore")
get_ipython().run_line_magic('matplotlib', 'inline')
from mrcnn.config import Config


model_path = r"C:\Users\tr248228\Documents\NucleiDetectFolder\logs\mask_rcnn_cell_0030.h5"
imagePath = 'X35Nuclei.jpg'

class InferenceConfig(CellConfig):
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    IMAGE_RESIZE_MODE = "pad64" # 'none' #
    DETECTION_MAX_INSTANCES = 3500 #3000
    DETECTION_MIN_CONFIDENCE = 0.5
    DETECTION_NMS_THRESHOLD = 0.20
    #ROI_POSITIVE_RATIO = 0.8
    RPN_ANCHOR_SCALES = (8, 16, 32, 64, 128)
    #MEAN_PIXEL = np.array([40,15,30])
    
    POST_NMS_ROIS_INFERENCE=12000 #15000

inference_config = InferenceConfig()
model = modellib.MaskRCNN(mode="inference", 
                          config=inference_config,
                          model_dir=MODEL_DIR)


model.load_weights(model_path, by_name=True)

# Load image
im = imageio.imread(imagePath)

# Transform image to 3 channels
im = cv2.cvtColor(im ,cv2.COLOR_GRAY2RGB)

r = model.detect([im], verbose=1)[0]


print('different things in data returned: ' + str(r.keys()))
print('You have ' + str(r['masks'].shape[2]) + ' nuclei detected')
print(r['masks'])

# get first mask as image
maskIndex = 0
oneMask = ndarray_to_pil(r['masks'][:,:,maskIndex]).convert("1")



# this is what they used to plot all nuclei with colors and more

# plt.figure(figsize=(20,10),dpi=100)
# im = imageio.imread(image)
# plt.subplot(1,2,1)
# plt.imshow(im)
# ax2=plt.subplot(1,2,2)
# r=results = model.detect([im], verbose=1)[0]
# visualize.display_instances_new(im, r['rois'], r['masks'], r['class_ids'], r['scores'], ax=ax2)
    

