import React, {Component} from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css'; // see installation section above for versions of NPM older than 3.0.0
// If you choose not to use import, you need to assign Cropper to default
// var Cropper = require('react-cropper').default
 
class ImageCrop extends Component {
  render() {
    return (
      <Cropper
        {...this.props}
        autoCrop={false}
        ref="cropper"
        cropend={(e) => this.props.cropend(e, this.refs.cropper.getData())}
        // Cropper.js options
        aspectRatio={this.props.width/this.props.height || 1}
        guides={false}
         />
    );
  }
}

export default ImageCrop;