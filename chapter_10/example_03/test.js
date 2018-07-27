const index = require('./index');

const mockEvent = {
    data: {
        bucket: '<YOUR BUCKET NAME>',
        name: '<A .png or .jpeg FILE IN YOUR BUCKET>'
    }
};

index.processImage(mockEvent, () => {
    console.log('successful callback')
});
