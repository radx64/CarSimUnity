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

private var isBrakeing : boolean = false;
var maxBrakeTorque : float;

@HideInInspector
var actualBacklightColor : Color;

private var sidewayFriction : float;
private var forwardFriction : float;
private var slipSidewayFriction : float;
private var slipForwardFriction : float;

function Start () 
{
	GetComponent.<Rigidbody>().centerOfMass.z += 0.03;
    GetComponent.<Rigidbody>().centerOfMass.y -= 0.55;
    setValues();
}
function setValues()
{
    forwardFriction = wheelRR.forwardFriction.stiffness;
    sidewayFriction = wheelRR.sidewaysFriction.stiffness;

    slipForwardFriction = 0.04;
    slipSidewayFriction = 0.01;
}
function FixedUpdate ()
{
	Control();
    handleHandBreak();
}

function Update()
{
	if (Input.GetKeyDown (KeyCode.R))
	{
		transform.rotation.x = 0;
        transform.rotation.z = 0;
	}
	
	GetComponent.<AudioSource>().pitch = 0.5 + GetComponent.<Rigidbody>().velocity.magnitude / lowestSteerAtSpeed;
	
	wheelFLTrans.Rotate((wheelFL.rpm/60)*360*Time.deltaTime,0,0);
	wheelFRTrans.Rotate((wheelFR.rpm/60)*360*Time.deltaTime,0,0);
	wheelRLTrans.Rotate((wheelRL.rpm/60)*360*Time.deltaTime,0,0);
	wheelRRTrans.Rotate((wheelRR.rpm/60)*360*Time.deltaTime,0,0);
	
	wheelFLTrans.localEulerAngles.y = wheelFL.steerAngle - wheelFLTrans.localEulerAngles.z;
	wheelFRTrans.localEulerAngles.y = wheelFR.steerAngle - wheelFRTrans.localEulerAngles.z;
	Backlight();
	Suspension();
}

function Control()
{
	currentSpeed = 2 * Mathf.PI * wheelRL.radius * wheelRL.rpm * 60 / 1000;
	currentSpeed = Mathf.Round(currentSpeed);
	if(currentSpeed < topSpeed && currentSpeed > -maxReverseSpeed && !isBrakeing)
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
	
	var speedFactor = GetComponent.<Rigidbody>().velocity.magnitude / lowestSteerAtSpeed;
	var currentSteerAngle = Mathf.Lerp(lowSpeedSteerAngle, highSpeedSteerAngle, speedFactor);
	currentSteerAngle *= Input.GetAxis("Horizontal");
	wheelFL.steerAngle = currentSteerAngle;
	wheelFR.steerAngle = currentSteerAngle;
}

function Backlight()
{
	var workingBacklightColor : Color = Color(3.0,0,0,0);
	var notWorkingBacklightColor : Color = Color.red;

	if((currentSpeed > 0 && Input.GetAxis("Vertical") < 0) || (currentSpeed < 0 && Input.GetAxis("Vertical") > 0) && !isBrakeing)
	{
		actualBacklightColor = Color.Lerp(actualBacklightColor, workingBacklightColor, Time.deltaTime * 4.0);
	}
	else
	{
		actualBacklightColor = Color.Lerp(actualBacklightColor, notWorkingBacklightColor, Time.deltaTime * 4.0);
	}
	leftStopBackLightObject.GetComponent.<Renderer>().material.color = actualBacklightColor;
	rightStopBackLightObject.GetComponent.<Renderer>().material.color = actualBacklightColor;
}

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

function handleHandBreak()
{
    if(Input.GetButton("Jump"))
    {
        isBrakeing = true;
    }
    else
    {
        isBrakeing = false;
    }
    
    if(isBrakeing)
    {
        wheelRL.brakeTorque = maxBrakeTorque;
        wheelRR.brakeTorque = maxBrakeTorque;
        
        wheelRL.motorTorque = 0;
        wheelRR.motorTorque = 0;
        setSlip(slipForwardFriction, slipSidewayFriction);
    }
    else
    {
        setSlip(forwardFriction, sidewayFriction);
    }
}

function setSlip(currentForwardFriction : float, currentSidewayFriction : float)
{
wheelRR.forwardFriction.stiffness = currentForwardFriction;
wheelRL.forwardFriction.stiffness = currentForwardFriction;
wheelFR.forwardFriction.stiffness = currentForwardFriction;
wheelFL.forwardFriction.stiffness = currentForwardFriction;


wheelRR.sidewaysFriction.stiffness = currentSidewayFriction;
wheelRL.sidewaysFriction.stiffness = currentSidewayFriction;
wheelFR.sidewaysFriction.stiffness = currentSidewayFriction;
wheelFL.sidewaysFriction.stiffness = currentSidewayFriction;
}