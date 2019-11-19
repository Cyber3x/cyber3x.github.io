import React, { Component } from 'react'
import Modal from 'react-modal';
import './Card.css'

class Card extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false
    };
    Modal.setAppElement('#root');
  }

  changeModalState = () => {
    this.setState({ modalOpen: !this.state.modalOpen })
  }

  render() {
    let toRender;

    if (this.props.list) {
      toRender = this.props.content;
    } else {
      toRender = this.props.content;
    }

    return (
      <div className='card-container'>
        <div className='card' onClick={this.changeModalState}>
          <p className='card-text'>{this.props.title}</p>
        </div>
        <Modal
          isOpen={this.state.modalOpen}
          contentLabel="Modal popup page"
          onRequestClose={this.changeModalState}
          className='modal'
          overlayClassName='overlay'
        >
          <div className='modal-page'>
            <div className="modal-page-content">
              <div className='header'>
                <p className='title'>{this.props.title}</p>
                <p className='back' onClick={this.changeModalState}>Back</p>
              </div>
              <div className='hr'></div>
              <div className='items'>
                <div className='project' >
                  <p className='project-title'>Project Profit</p>
                  <p className='project-role'>Founder</p>
                  <a
                    className='project-link'
                    href='https://github.com/cyber3x/project-profit'
                    target="_blank"
                    rel="noopener noreferrer"
                  >View Website</a>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    )
  }
}

export default Card;

