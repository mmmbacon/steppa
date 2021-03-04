import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { withStyles } from '@material-ui/core/styles';
import { ArrowForwardIos,ArrowBackIos,PlayArrow, Stop } from '@material-ui/icons';
import logo from './logo.svg';
import './App.css';
import { Time, Sequence, Transport, Players, Context, Sampler } from 'tone'; 

import { Box, Grid, Typography, Button, TextField, IconButton } from '@material-ui/core';

//Component Imports
import StepButton from './components/StepButton';

import bd from './audio/TR909/bd01.wav';
import cp from './audio/TR909/cp01.wav';
import sn from './audio/TR909/sd01.wav';
import oh from './audio/TR909/oh01.wav';
import ch from './audio/TR909/hh01.wav';

import A1 from './audio/TR909/bd01.wav';
import A2 from './audio/TR909/cp01.wav';
import A3 from './audio/TR909/sd01.wav';
import A4 from './audio/TR909/hh01.wav';

const CssTextField = withStyles({
  root: {
    '& label.Mui-focused': {
      color: 'red',
    },
    '& MuiInputBase-input': {
      color: 'red',
    },
    '& MuiOutlinedInput-input' : {
      color: 'red',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'red',
      color: 'red',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'yellow',
        color: 'red',
        maxHeight: '40px',
        lineHeight: '0em'
      },
      '&:hover fieldset': {
        borderColor: 'red',
        color: 'red',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'red',
        color: 'red',
      },
    },
  },
})(TextField);

const styles = theme => ({
  label : {
    width : '100px',
    background: 'linear-gradient(270deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 100%)',
    marginBottom: '5px',
    borderRadius: '50px 0px 0px 0px',
    boxShadow: '4px 4px 4px rgb(0,0,0,0.025)',
  },
  BPMButton: {
    color: 'white',
  },
  BPMText: {
    minWidth: '30px',
    textAlign: 'center'
  },
  SwingText: {
    minWidth: '30px',
    textAlign: 'center'
  },
  transportButton: {
    backgroundColor: 'rgb(255,255,255,0.2)',
    borderColor: 'white',
    color: 'white',
    padding: '0px',
    borderRadius: '0px',
    marginLeft: '10px',
    boxShadow: '4px 4px 4px rgb(0,0,0,0.05)',
  }
})

class App extends React.Component {

  constructor(props){
    super(props);

    this.handlePlay = this.handlePlay.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.updateBDStep = this.updateBDStep.bind(this);
    this.handleBPMChange = this.handleBPMChange.bind(this);
    this.handleSwingChange = this.handleSwingChange.bind(this);

    this.defaultSequence = [
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    ]
    this.state = {
      samplesLoaded : false,
      activeStep : -1,
      bpm: 120,
      swing: 0
    }

    this.player = new Players({
      'BD' : bd,
      'CP' : cp,
      'SN' : sn,
      'CH' : ch,
      'OH' : oh
    }, function(){
      this.setState({
        samplesLoaded: true
      })
    }).toMaster();

    this.BDPlayer = new Sampler({
      "A1" : bd}).toMaster();
    this.OHPlayer = new Sampler({
      "A1" : oh}).toMaster();
    this.CHPlayer = new Sampler({
      "A1" : ch}).toMaster();
    this.CPPlayer = new Sampler({
      "A1" : cp}).toMaster();
    this.SNPlayer = new Sampler({
      "A1" : sn}).toMaster();

    //Sequencer for visuals only
    
    this.GUIsequencer = new Sequence(function(time,note){
      this.setState({
        activeStep : ( this.state.activeStep != 15 ? this.state.activeStep + 1 : 0 )
      });
      
    }.bind(this), this.defaultSequence, "16n").start(0);

    this.BDsequencer = new Sequence(function(time,note){
      if(note === 1){
        this.BDPlayer.triggerAttack("A1")
      }
    }.bind(this), this.defaultSequence, "16n").start(0);

    this.SNsequencer = new Sequence(function(time,note){
      if(note === 1){
        this.SNPlayer.triggerAttack("A1")
      }
    }.bind(this), this.defaultSequence, "16n").start(0);

    this.CPsequencer = new Sequence(function(time,note){
      if(note === 1){
        this.CPPlayer.triggerAttack("A1")
      }
    }.bind(this), this.defaultSequence, "16n").start(0);

    this.OHsequencer = new Sequence(function(time,note){
      if(note === 1){
        this.OHPlayer.triggerAttack("A1")
      }
    }.bind(this), this.defaultSequence, "16n").start(0);

    this.CHsequencer = new Sequence(function(time,note){
      if(note === 1){
        this.CHPlayer.triggerAttack("A1")
      }
    }.bind(this), this.defaultSequence, "16n").start(0);

    Context.latencyHint = "fastest"; //interactive,balanced,fastest,playback
    Context.lookAhead = 0;
    Transport.swing = this.state.swing;
    Transport.bpm.value = this.state.bpm;

    Transport.loopStart = '0:0:0';
    Transport.loopEnd = '0:0:0';
    Transport.humanize = false;
  }

  handlePlay(){
    Transport.start(0);
  }

  handleStop(){
    Transport.stop();
    this.setState({
      activeStep : -1
    })
  }

  handleBPMChange(increment){
    let min = 1;
    let max = 10000;
    Transport.bpm.value = this.state.bpm + increment;
    this.setState({
      bpm: Math.min(Math.max(this.state.bpm + increment, min), max)
    })
  }

  handleSwingChange(increment){
    let min = 0;
    let max = 100;
    Transport.swing = (this.state.swing + increment) / 100;
    this.setState({
      swing: Math.min(Math.max(this.state.swing + increment, min), max)
    })
  }


  updateBDStep(index, state){
    this.BDsequencer.at(index, state ? 1 : 0);
  }

  updateSNStep(index, state){
    this.SNsequencer.at(index, state ? 1 : 0);
  }

  updateCPStep(index, state){
    this.CPsequencer.at(index, state ? 1 : 0);
  }

  updateOHStep(index, state){
    this.OHsequencer.at(index, state ? 1 : 0);
  }

  updateCHStep(index, state){
    this.CHsequencer.at(index, state ? 1 : 0);
  }

  render(){

    const { classes } = this.props;

    let BDSequence = this.defaultSequence.map((value,index)=>{
      return (
        <StepButton key={index} id={index} activeStep={this.state.activeStep} onClick={(e, s)=>this.updateBDStep(e, s)} border={index === 0 || index === 4 || index === 8 || index === 12 ? true : false }></StepButton>
      )
    });

    let SNSequence = this.defaultSequence.map((value,index)=>{
      return (
        <StepButton key={index} id={index} activeStep={this.state.activeStep} onClick={(e, s)=>this.updateSNStep(e, s)} border={index === 0 || index === 4 || index === 8 || index === 12 ? true : false }></StepButton>
      )
    });

    let CPSequence = this.defaultSequence.map((value,index)=>{
      return (
        <StepButton key={index} id={index} activeStep={this.state.activeStep} onClick={(e, s)=>this.updateCPStep(e, s)} border={index === 0 || index === 4 || index === 8 || index === 12 ? true : false }></StepButton>
      )
    });

    let OHSequence = this.defaultSequence.map((value,index)=>{
      return (
        <StepButton key={index} id={index} activeStep={this.state.activeStep} onClick={(e, s)=>this.updateOHStep(e, s)} border={index === 0 || index === 4 || index === 8 || index === 12 ? true : false }></StepButton>
      )
    });

    let CHSequence = this.defaultSequence.map((value,index)=>{
      return (
        <StepButton key={index} id={index} activeStep={this.state.activeStep} onClick={(e, s)=>this.updateCHStep(e, s)} border={index === 0 || index === 4 || index === 8 || index === 12 ? true : false }></StepButton>
      )
    });

    return (

      

      <div className="App">
        <header className="App-header">

          {/*HEADING SECTION */}
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item>
              <Box my={1}>
                <Typography variant="h4">STEPPY.DEV</Typography>
              </Box>
            </Grid>
          </Grid>

          {/*TRANSPORT CONTROLS SECTION*/ }
          <Grid container direction="row" justify="center" alignItems="center">
              
              {/* BPM Button */}
              <Grid item>
                <Grid container direction="row" justify="center" alignItems="center">
                  <Grid item>
                    <IconButton className={classes.BPMButton} onClick={()=>{this.handleBPMChange(-1)}}>
                      <ArrowBackIos></ArrowBackIos>
                    </IconButton>
                  </Grid>
                  <Grid item className={classes.BPMText}>
                    <Box><Typography>{this.state.bpm}</Typography></Box>
                  </Grid>
                  <Grid item>
                    <IconButton className={classes.BPMButton} onClick={()=>{this.handleBPMChange(1)}}>
                      <ArrowForwardIos></ArrowForwardIos>
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>

              {/* Swing Button */}
              <Grid item>
                <Grid container direction="row" justify="center" alignItems="center">
                  <Grid item>
                    <IconButton className={classes.BPMButton} onClick={()=>{this.handleSwingChange(-5)}}>
                      <ArrowBackIos></ArrowBackIos>
                    </IconButton>
                  </Grid>
                  <Grid item className={classes.SwingText}>
                    <Box><Typography>{this.state.swing}%</Typography></Box>
                  </Grid>
                  <Grid item>
                    <IconButton className={classes.BPMButton} onClick={()=>{this.handleSwingChange(5)}}>
                      <ArrowForwardIos></ArrowForwardIos>
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item>
                <Grid container direction="row" justify="center" alignItems="center">
                  <Button 
                      variant="outlined" 
                      color="primary"
                      className={classes.transportButton}
                      disabled={this.state.sampleLoaded} 
                      onClick={this.handlePlay}><PlayArrow></PlayArrow></Button>
                </Grid>
              </Grid>
              <Grid item>
                <Grid container direction="row" justify="center" alignItems="center">
                  <Button 
                      variant="outlined" 
                      color="primary"
                      className={classes.transportButton}
                      disabled={this.state.sampleLoaded} 
                      onClick={this.handleStop}><Stop></Stop></Button>
                </Grid>
              </Grid>
          </Grid>

          { /* SEQUENCER SECTION */}
          <Grid container xs={12} direction="row" justify="center" alignItems="center" >
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>BD</Typography></Box></Grid>{BDSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>SN</Typography></Box></Grid>{SNSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>CP</Typography></Box></Grid>{CPSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>LT</Typography></Box></Grid>{CHSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>MT</Typography></Box></Grid>{CHSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>HT</Typography></Box></Grid>{CHSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>RM</Typography></Box></Grid>{OHSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>CP</Typography></Box></Grid>{CHSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>HH</Typography></Box></Grid>{BDSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>OH</Typography></Box></Grid>{BDSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>CY</Typography></Box></Grid>{SNSequence}</Grid>

            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>BASS</Typography></Box></Grid>{SNSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>CHORD</Typography></Box></Grid>{SNSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>KEY</Typography></Box></Grid>{SNSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>FX</Typography></Box></Grid>{SNSequence}</Grid>
            <Grid container item direction="row" justify="center" alignItems="center"><Grid container item className={classes.label} justify="flex-end" alignItems="center"><Box pr={2}><Typography>VOx</Typography></Box></Grid>{SNSequence}</Grid>
          </Grid>
        </header>
      </div>
    );
  }
}

export default withStyles(styles)(App);
