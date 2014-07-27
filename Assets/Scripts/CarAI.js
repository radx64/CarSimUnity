#pragma strict

var wheelFL : WheelCollider;
var wheelFR : WheelCollider;
var wheelRL : WheelCollider;
var wheelRR : WheelCollider;

var wheelFLTrans : Transform;
var wheelFRTrans : Transform;
var wheelRLTrans : Transform;
var wheelRRTrans : Transform;


var lowestSteerAtSpeed : float = 50;
var lowSpeedSteerAngle : float = 10;
var highSpeedSteerAngle : float = 1;

var deccelerationSpeed : float = 30;
@HideInInspector
var currentSpeed : float = 0.0;
var topSpeed : float = 90.0;
var maxReverseSpeed : float = 30.0;

var maxTorque : float = 25.0;

var leftStopBackLightObject : GameObject;
var rightStopBackLightObject : GameObject;
@HideInInspector
var actualBacklightColor : Color;

var followedCar : GameObject;

function Start () 
{
	rigidbody.centerOfMass.z = 0.2;
}

function FixedUpdate ()
{
	Control();
}

function Update()
{
	audio.pitch = 0.5 + rigidbody.velocity.magnitude / lowestSteerAtSpeed;
	
	wheelFLTrans.Rotate((wheelFL.rpm/60)*360*Time.deltaTime,0,0);
	wheelFRTrans.Rotate((wheelFR.rpm/60)*360*Time.deltaTime,0,0);
	wheelRLTrans.Rotate((wheelRL.rpm/60)*360*Time.deltaTime,0,0);
	wheelRRTrans.Rotate((wheelRR.rpm/60)*360*Time.deltaTime,0,0);
	
	wheelFLTrans.localEulerAngles.y = wheelFL.steerAngle - wheelFLTrans.localEulerAngles.z;
	wheelFRTrans.localEulerAngles.y = wheelFR.steerAngle - wheelFRTrans.localEulerAngles.z;
	//Backlight();
	Suspension();
}

function Control()
{
	/*
	currentSpeed = 2 * Mathf.PI * wheelRL.radius * wheelRL.rpm * 60 / 1000;
	currentSpeed = Mathf.Round(currentSpeed);
	if(currentSpeed < topSpeed && currentSpeed > -maxReverseSpeed)
	{
		wheelRL.motorTorque = maxTorque * Input.GetAxis("Vertical");
		wheelRR.motorTorque = maxTorque * Input.GetAxis("Vertical");
	}
	else
	{
		wheelRL.motorTorque = 0;
		wheelRR.motorTorque = 0;
	}
	
	if(Input.GetButton("Vertical") == false)
	{
		
		wheelFL.brakeTorque = deccelerationSpeed;
		wheelFR.brakeTorque = deccelerationSpeed;
		wheelRL.brakeTorque = deccelerationSpeed;
		wheelRR.brakeTorque = deccelerationSpeed;
	}
	else
	{
		wheelFL.brakeTorque = 0.0;
		wheelFR.brakeTorque = 0.0;
		wheelRL.brakeTorque = 0.0;
		wheelRR.brakeTorque = 0.0;
	}
	*/
	
	var heading = followedCar.transform.position - transform.position;
	heading.y = 0;
	var distance = heading.magnitude;
	var direction = heading / distance;
    
	print("Current rotation: " + transform.eulerAngles.y + " Rotation to followed" + (Mathf.Atan2(direction.x, direction.z)*180/Mathf.PI) );
	var currentSteerAngle = Mathf.Lerp(lowSpeedSteerAngle, highSpeedSteerAngle, 1);
	
	currentSteerAngle *= Input.GetAxis("Horizontal");
	wheelFL.steerAngle = currentSteerAngle;
	wheelFR.steerAngle = currentSteerAngle;

}

/*
function Backlight()
{
	var workingBacklightColor : Color = Color(3.0,0,0,0);
	var notWorkingBacklightColor : Color = Color.red;

	if((currentSpeed > 0 && Input.GetAxis("Vertical") < 0) || (currentSpeed < 0 && Input.GetAxis("Vertical") > 0))
	{
		actualBacklightColor = Color.Lerp(actualBacklightColor, workingBacklightColor, Time.deltaTime * 4.0);
	}
	else
	{
		actualBacklightColor = Color.Lerp(actualBacklightColor, notWorkingBacklightColor, Time.deltaTime * 4.0);
	}
	leftStopBackLightObject.renderer.material.color = actualBacklightColor;
	rightStopBackLightObject.renderer.material.color = actualBacklightColor;
}
*/
function Suspension()
{
	singleWheelSuspension(wheelFL,wheelFLTrans);
	singleWheelSuspension(wheelFR,wheelFRTrans);
	singleWheelSuspension(wheelRL,wheelRLTrans);
	singleWheelSuspension(wheelRR,wheelRRTrans);
}

function singleWheelSuspension(wheelCollider : WheelCollider, wheelTrans : Transform)
{
	var hit : RaycastHit;
	var wheelPos : Vector3;
	if(Physics.Raycast(wheelCollider.transform.position, -wheelCollider.transform.up, hit, wheelCollider.radius + wheelCollider.suspensionDistance))
	{
		wheelPos = hit.point + wheelCollider.transform.up * wheelCollider.radius;
	}
	else
	{
		wheelPos = wheelCollider.transform.position - wheelCollider.transform.up * wheelCollider.suspensionDistance;
	}
	wheelTrans.position = wheelPos;

}