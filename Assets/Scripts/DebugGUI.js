#pragma strict

var debuggedObject : GameObject;

function OnGUI() 
{
	GUI.Window(0,Rect(0,0,300,300),DebugWindowControls,"Debug Window");
}

function DebugWindowControls(windowID : int)
{
	GUI.Label(Rect(25,25,100,20),"Steering");
	GUI.HorizontalSlider(Rect(100,30,100,20),Input.GetAxis("Horizontal"),-1.0,1.0);
	
	GUI.Label(Rect(25,50,100,20), "Throttle");
	GUI.HorizontalSlider(Rect(100,55,100,20),Input.GetAxis("Vertical"),0.0,1.0);
	
	GUI.Label(Rect(25,75,100,20), "Brakes");
	GUI.HorizontalSlider(Rect(100,80,100,20),Input.GetAxis("Vertical"),0.0,-1.0);
	
	GUI.Label(Rect(25,100,100,20), "Speed:");
	var speed = Mathf.FloorToInt(debuggedObject.GetComponent.<Rigidbody>().velocity.magnitude * 3.6);
	GUI.Label(Rect(100,100,100,20), speed.ToString() + " km/h");
    
    GUI.Label(Rect(25,125,100,20), "Gear:");
    var gear = 0;
    GUI.Label(Rect(100,125,100,20), gear.ToString());
    
    GUI.Label(Rect(25,150,100,20), "RPM:");
    var engineRPM = 450 + speed*43.1;
    GUI.Label(Rect(100,150,100,20), engineRPM.ToString()); 
    
}