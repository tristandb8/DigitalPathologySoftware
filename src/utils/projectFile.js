export const projectFile = (type, name, path, cellDetectChannel, imageData) => {
  let channelNames = [];
  if (type === "tiff")
    imageData.idfArray.forEach((_, index) =>
      channelNames.push(`Channel ${index + 1}`)
    );
  return {
    type,
    name,
    path,
    cellDetectChannel,
    imageData,
    channelNames,
    nucleusDetection: null,
    cytoDetection: null,
    annotations: [],
  };
};
