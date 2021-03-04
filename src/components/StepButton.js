import React, { useState } from 'react';
import { tsPropertySignature } from '@babel/types';

function StepButton(props){

    const [bstate, setBState] = useState(false);
    const [downState, setDownState] = useState(false);

    return (
        <div onClick={() => { setBState(!bstate); props.onClick(props.id, !bstate); }}
            onMouseDown={()=> setDownState(true) } 
            onMouseUp={()=> setDownState(false) } 
            onMouseLeave={()=> setDownState(false) } 
            style={{
            background: props.activeStep == props.id ? 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0) 100%)' : 'none',
            backgroundColor: bstate ? downState ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' : downState ? 'rgba(0,0,0,0.2)' : `rgba(255,255,255,${ props.activeStep == props.id ? '0.3' : '0.2'})`,
            padding: 2,
            marginBottom: 5,
            marginLeft: 5,
            
            width: 'auto',
            height: 'auto',
            display: 'inline-block',
            borderRadius: downState? '25px' : '0px',
            border: `1px solid rgb(255,255,255,${ props.border && !downState ? 0.5 : 0})`
          }}>
            <div style={{
              minWidth: 35,
              maxWidth: 35,
              minHeight: 35,
              maxHeight: 35,
              lineHeight: '50px'
  
            }}></div>
          </div>
    )
}

export default StepButton;