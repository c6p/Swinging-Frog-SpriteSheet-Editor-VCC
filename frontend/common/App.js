import React from 'react';
import styled, { keyframes } from 'styled-components';
import CustomVcc from '@withkoji/custom-vcc-sdk';
import Koji from '@withkoji/vcc';
import ImageCrop from './imagecrop.js';
import Cropper from 'cropperjs';
import ReactTooltip from 'react-tooltip'

const Container = styled.div`
`;

const FileInput = styled.input.attrs(props => ({
  type: "file",
}))`
  opacity: 0;
  position: absolute;
  z-index: -1;
`;

const Checkbox = styled.input.attrs(props => ({
  type: "checkbox",
}))`
`;

const Button = styled.button`
  display: inline-block;
  border-radius: 3px;
  padding: 0.5rem;
  margin: 0.5rem;
  background: greenyellow;
  font-family: inherit;
  font-size: 100%;
  border: 2px solid #666;
  &:hover{
    background-color: #666;
    color: white;
  }
`;

const ButtonLabel = styled.label`
  border: 2px solid #666;
  border-radius: 3px;
  margin: 0.5rem;
  padding: 0.5rem;
  background: greenyellow;
  &:hover{
    background-color: #666;
    color: white;
  }
`;

const NumberInput = styled.input.attrs(props => ({
  type: "number",
}))`
  color: #3;
  font-size: 1em;
  border: 2px solid #666;
  border-radius: 3px;
  width: 5rem;
  margin: 0.5em;
  padding: 0.5em;
`;

const Loading = styled.div`
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  position: absolute;
  background: #eeee;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
`

const Animation = styled.div.attrs(props => ({

}))`
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  background: transparent url(${p => p.src}) 0 0 no-repeat;
  animation: anim ${p => p.duration}s steps(1) infinite;
/* Animation keyframes for the sprite */
@keyframes anim {
  ${p => p.frames.map((f, i) => `${100 * i / p.frames.length}% { background-position: ${-i * p.width}px 0;}`).join(' ')}
}
`

function resize(arr, newSize, defaultValue) {
  return [...arr, ...Array(Math.max(newSize - arr.length, 0)).fill(defaultValue)];
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.customVcc = new CustomVcc();
    Cropper.noConflict();

    this.state = {
      options: {
        width: 100,
        height: 100,
        frameCount: 4,
        vertical: false,
        default: "https://images.koji-cdn.com/baa36116-cd5c-4c4d-b826-73e36747d979/zjywo-atlas.png",
        boundShape: 'circle',
        boundProps: { cx: 50, cy: 25, r: 25 },
        duration: 4,
        frames: [0, 1, 2, 3]
      },
      name: "",
      value: "https://images.koji-cdn.com/baa36116-cd5c-4c4d-b826-73e36747d979/zjywo-atlas.png",
      activeFrame: 0,
      frameSrc: [],
      activeImage: null,
      showBounds: true,
      data: { x: 0, y: 0, width: 0, height: 0 },
      uploading: false
    };

    this.customVcc.onUpdate((newProps) => {
      if (newProps.value && newProps.value !== '') {
        this.setState({
          ...this.state,
          ...newProps
        });
      }
      this.updateFrames()
    });

  }

  componentDidMount() {
    this.customVcc.register('50%', '100vh');
    this.updateFrames()
  }

  updateFrames() {
    const { width, height, frameCount, vertical } = this.state.options
    let frameSrc = []
    let i = 0;
    let cropper = new Cropper(this.refs.value, {
      crop: () => {
        // workaround
        const { x: X, width: W } = cropper.getData(true)
        if (X === i * width && W === width) {
          frameSrc.push(cropper.getCroppedCanvas().toDataURL())
          i++
        }
        if (i < frameCount) {
          let [x, y] = [0, 0]
          if (vertical)
            y = i * height
          else
            x = i * width
          cropper.setData({ x, y, width, height }).crop()
        } else {
          this.setState({ frameSrc })
          cropper.destroy()
        }
      }
    })
  }

  resetDefault() {
    this.setState({ value: this.state.options.default }, this.updateFrames)
  }


  crop() {
    const cropper = this.refs.imagecrop.refs.cropper
    cropper.crop()
    const { width, height } = this.state.options
    const v = cropper.getCroppedCanvas({ width, height, imageSmoothingQuality: 'hight' }).toDataURL()
    let frameSrc = [...this.state.frameSrc]
    frameSrc[this.state.activeFrame] = v
    this.setState({ frameSrc }, this.mergeFrames)
  }

  handleImage(e) {
    var reader = new FileReader();
    reader.onload = (event) => this.setState({ activeImage: event.target.result })
    reader.readAsDataURL(e.target.files[0]);
  }

  handleData(e, v) {
    if (e.target.type === "number") {
      const cropper = this.refs.imagecrop.refs.cropper
      let data = cropper.getData(true)
      data[e.target.id] = parseInt(e.target.value)
      cropper.setData(data)
      const { x, y, width, height } = cropper.getData(true)
      this.setState({ data: { x, y, width, height } })
    }
    else {
      this.setState({ data: v })
    }
  }

  mergeFrames() {
    const { width, height, frameCount, vertical } = this.state.options
    const canvas = this.refs.merge;
    canvas.width = vertical ? width : frameCount * width;
    canvas.height = vertical ? frameCount * height : height;
    let context = canvas.getContext('2d');
    //console.log(this.refs.frames)
    //this.refs.frames.childNodes.forEach((node, i) => {
    //  if (node.tagName !== 'svg')
    //    return
    for (let i = 0; i < frameCount; i++) {
      let [x, y] = [0, 0]
      if (vertical)
        y = i * height
      else
        x = i * width
      let img = new Image()
      img.src = this.state.frameSrc[i]
      img.onload = () => {
        context.drawImage(img, x, y);
        if (i === frameCount - 1) {
          window.requestAnimationFrame(() => this.setState({ value: canvas.toDataURL() }))
        }
      };
      //  context.drawImage(node.childNodes[0], x, y);
    }//);
  }

  uploadSpritesheet() {
    if (this.state.uploading)
      return
    this.setState({ uploading: true })
    this.customVcc.showModal('image', this.state.value, (url) => {
      this.setState({ value: url, uploading: false }, this.updateFrames)
      this.customVcc.change({ value: url });
      this.customVcc.save();
    });
  }

  saveSpritesheet() {
    if (this.state.uploading)
      return
    this.setState({ uploading: true })
    const canvas = this.refs.merge;
    //window.requestAnimationFrame(() => {
    canvas.toBlob((blob) =>
      this.customVcc.uploadFile(blob, this.state.name, (url) => {
        this.setState({ value: url, uploading: false })
        this.customVcc.change({ value: url });
        this.customVcc.save();
      })
    )
    //})
  }

  render() {
    const Shape = this.state.options.boundShape
    const { width, height, duration, frames, boundProps } = this.state.options
    return (
      <Container>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#cccc', fontSize: '0.8em' }}>
          <div ref="frames" data-tip="Select a frame to modify">
            {this.state.frameSrc.map((src, i) => (
              <svg onClick={() => this.setState({ activeFrame: i })} key={i} width={width} height={height}
                style={{ minWidth: width, border: '2px ' + (i === this.state.activeFrame ? 'solid red' : 'solid black') }}
                version="1.1" xmlns="http://www.w3.org/2000/svg">
                <image width={width} height={height} href={src}></image>
                {this.state.showBounds && <Shape {...boundProps} stroke="red" fill="transparent" strokeWidth="1"></Shape>}
              </svg>
            ))}
          </div>
          <Animation src={this.state.value} duration={duration} frames={frames} width={width} height={height}></Animation>
          <Button style={{ position: 'relative' }} onClick={this.saveSpritesheet.bind(this)}
            data-tip="Upload a SpriteSheet directly from your PC or Internet">Upload SpriteSheet
            {this.state.uploading && <Loading>Uploading...</Loading>}
          </Button>
          <label><Checkbox checked={this.state.showBounds} onChange={(e) => this.setState({ showBounds: e.target.checked })}></Checkbox>Show bounding box</label>
          <Button onClick={this.resetDefault.bind(this)} data-tip='If you messed up, reset default image'>!!! Reset Default</Button>
          <div style={{ display: 'none' }}>
            <img ref="value" src={this.state.value}></img>
            <canvas ref="merge" style={{ display: 'block' }}></canvas>
          </div>
          <div>
            <ButtonLabel data-tip='Open an image to crop a frame from'>Select Image<FileInput id="file" onChange={this.handleImage.bind(this)}></FileInput></ButtonLabel>
            <label>x:<NumberInput id="x" value={this.state.data.x} onChange={this.handleData.bind(this)}></NumberInput></label>
            <label>y:<NumberInput id="y" value={this.state.data.y} onChange={this.handleData.bind(this)}></NumberInput></label>
            <label>width:<NumberInput id="width" value={this.state.data.width} onChange={this.handleData.bind(this)}></NumberInput></label>
            <label>height:<NumberInput id="height" value={this.state.data.height} onChange={this.handleData.bind(this)}></NumberInput></label>
            <Button onClick={this.crop.bind(this)} data-tip="Set cropped image to current frame">Crop Frame</Button>
            <Button style={{ position: 'relative' }} onClick={this.saveSpritesheet.bind(this)} data-tip="Save & upload final spritesheet">Save SpriteSheet
            {this.state.uploading && <Loading>Uploading...</Loading>}
            </Button>
          </div>
        </div>
        <ImageCrop ref="imagecrop" cropend={this.handleData.bind(this)} src={this.state.activeImage} width={width} height={height}></ImageCrop>
        <ReactTooltip multiline={true} />
      </Container>
    );
  }
}

export default App;
